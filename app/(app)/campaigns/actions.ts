"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { allAffinityGroupIds, countryUniversityIds, findCountry, targetRoles } from "@/lib/data";
import { buildXRayQueries } from "@/lib/services/xray";
import { startXRayRun } from "@/lib/services/apify";
import { importRun } from "@/lib/services/import-leads";
import { dropcontactProvider } from "@/lib/services/enrichment/dropcontact";
import { harvestApiProvider } from "@/lib/services/enrichment/harvestapi";
import { generateMessage } from "@/lib/services/copywriting";
import type { Campaign, GroupMode, Lead } from "@/lib/types";

export type CampaignFormState = { error: string | null };

export interface CampaignPayload {
  name: string;
  country: string;
  universities: string[];
  roles: string[];
  groups: string[];
  groupMode: GroupMode;
  batchSize: number;
}

const roleIds = new Set<string>(targetRoles.map((r) => r.id));
const groupIds = new Set(allAffinityGroupIds);

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function createCampaign(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");

  let raw: Partial<CampaignPayload>;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { error: "Données du formulaire invalides." };
  }

  // Revalidation serveur contre les référentiels statiques : le client n'est pas digne de confiance.
  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 120) : "";
  if (!name) return { error: "Donnez un nom à la campagne." };

  const match = typeof raw.country === "string" ? findCountry(raw.country) : null;
  if (!match) return { error: "Choisissez un pays cible." };

  const validUniversities = new Set(countryUniversityIds(match.country));
  const universities = [...new Set(asStringArray(raw.universities))].filter((id) => validUniversities.has(id));
  const roles = [...new Set(asStringArray(raw.roles))].filter((id) => roleIds.has(id));
  const groups = [...new Set(asStringArray(raw.groups))].filter((id) => groupIds.has(id));
  const groupMode: GroupMode = raw.groupMode === "standalone" ? "standalone" : "cross_filter";
  const batchSize = Number(raw.batchSize);

  if (!roles.length) return { error: "Sélectionnez au moins un métier cible." };
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 5000) {
    return { error: "La taille du lot doit être comprise entre 1 et 5000." };
  }

  const { error } = await supabase.from("campaigns").insert({
    name,
    target_region: match.region.id,
    target_country: match.country.code,
    target_universities: universities,
    target_roles: roles,
    target_groups: groups,
    group_mode: groupMode,
    batch_size: batchSize,
    status: "draft",
  });

  if (error) return { error: `Échec de l'enregistrement : ${error.message}` };

  revalidatePath("/campaigns");
  redirect("/campaigns");
}

/**
 * Phase 3 : Lance la campagne d'extraction Google X-Ray sur Apify
 */
export async function launchCampaign(campaignId: string) {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (error || !campaign) {
    return { success: false, error: "Campagne introuvable." };
  }

  try {
    const queries = buildXRayQueries(campaign as Campaign);
    const runId = await startXRayRun(campaignId, queries);

    await supabase
      .from("campaigns")
      .update({
        status: "running",
        apify_run_id: runId,
        launched_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", campaignId);

    revalidatePath("/campaigns");
    return { success: true, runId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("campaigns")
      .update({ last_error: message })
      .eq("id", campaignId);
    return { success: false, error: message };
  }
}

/**
 * Phase 3 : Synchronise manuellement les résultats d'un run Apify (secours local / sans webhook)
 */
export async function syncCampaign(campaignId: string) {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("apify_run_id")
    .eq("id", campaignId)
    .single();

  if (error || !campaign?.apify_run_id) {
    return { success: false, error: "Aucun run Apify associé à cette campagne." };
  }

  try {
    const summary = await importRun(campaignId, campaign.apify_run_id);
    revalidatePath("/campaigns");
    revalidatePath("/leads");
    return { success: true, summary };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Phase 4 : Lance l'enrichissement email par lot (HarvestAPI / Dropcontact)
 */
export async function enrichCampaign(campaignId?: string) {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("leads")
    .select("id, first_name, last_name, full_name, current_company, linkedin_url")
    .eq("email_status", "pending")
    .limit(100);

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  // Récupération des leads pending hors liste d'exclusion
  const [leadsRes, suppressionRes] = await Promise.all([
    query,
    supabase.from("suppression_list").select("linkedin_url"),
  ]);

  if (leadsRes.error) {
    return { success: false, error: leadsRes.error.message };
  }

  const suppressedUrls = new Set(
    (suppressionRes.data || []).map((s) => s.linkedin_url?.toLowerCase()).filter(Boolean),
  );

  const eligibleLeads = (leadsRes.data || []).filter(
    (l) => !suppressedUrls.has(l.linkedin_url.toLowerCase()),
  );

  if (eligibleLeads.length === 0) {
    return {
      success: false,
      error: "Aucun lead en attente d'enrichissement trouvé.",
    };
  }

  try {
    // Priorité à HarvestAPI (Apify LinkedIn Profile Scraper) si APIFY_TOKEN est présent
    const useHarvestApi = Boolean(process.env.APIFY_TOKEN);
    const providerName = useHarvestApi ? "harvestapi" : "dropcontact";
    const provider = useHarvestApi ? harvestApiProvider : dropcontactProvider;

    const externalId = await provider.submit(eligibleLeads);

    await supabase.from("enrichment_jobs").insert({
      campaign_id: campaignId || eligibleLeads[0].id,
      provider: providerName,
      external_id: externalId,
      status: "pending",
      lead_ids: eligibleLeads.map((l) => l.id),
    });

    revalidatePath("/campaigns");
    revalidatePath("/leads");
    return { success: true, submittedCount: eligibleLeads.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Phase 4 : Synchronise les jobs d'enrichissement ouverts
 */
export async function syncEnrichment(campaignId?: string) {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("enrichment_jobs")
    .select("*")
    .eq("status", "pending");

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data: jobs, error } = await query;

  if (error || !jobs?.length) {
    return { success: false, error: "Aucun job d'enrichissement en cours." };
  }

  let updatedCount = 0;
  for (const job of jobs) {
    if (job.provider === "harvestapi") {
      const { data: jobLeads } = await supabase
        .from("leads")
        .select("id, linkedin_url")
        .in("id", job.lead_ids);

      const leadsMap = new Map<string, string>();
      for (const l of jobLeads || []) {
        leadsMap.set(l.id, l.linkedin_url);
      }

      const pollRes = await harvestApiProvider.poll(job.external_id, leadsMap);
      if (pollRes.completed) {
        for (const item of pollRes.results) {
          const updatePayload: { business_email?: string | null; email?: string | null; email_status: string } = {
            email_status: item.status,
          };
          if (item.email) {
            updatePayload.business_email = item.email;
            updatePayload.email = item.email;
          }

          await supabase.from("leads").update(updatePayload).eq("id", item.leadId);
          updatedCount++;
        }
        await supabase
          .from("enrichment_jobs")
          .update({ status: pollRes.error ? "failed" : "completed" })
          .eq("id", job.id);
      }
    } else if (job.provider === "dropcontact") {
      const pollRes = await dropcontactProvider.poll(job.external_id);
      if (pollRes.completed) {
        for (const item of pollRes.results) {
          const updatePayload: { business_email?: string | null; email?: string | null; email_status: string } = {
            email_status: item.status,
          };
          if (item.email) {
            updatePayload.business_email = item.email;
            updatePayload.email = item.email;
          }

          await supabase.from("leads").update(updatePayload).eq("id", item.leadId);
          updatedCount++;
        }
        await supabase
          .from("enrichment_jobs")
          .update({ status: "completed" })
          .eq("id", job.id);
      }
    }
  }

  revalidatePath("/campaigns");
  revalidatePath("/leads");
  return { success: true, updatedCount };
}

/**
 * Phase 5 : Génère les accroches IA personnalisées pour les leads qualifiés
 */
export async function generateMessages(campaignId: string) {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .eq("campaign_id", campaignId)
    .in("email_status", ["verified", "risky"])
    .is("ai_personalized_message", null)
    .limit(50);

  if (error || !leads?.length) {
    return { success: false, error: "Aucun lead éligible sans message trouvé." };
  }

  const typedLeads = leads as Lead[];
  let generatedCount = 0;

  // Traitement 5 par 5 en parallèle
  const chunkSize = 5;
  for (let i = 0; i < typedLeads.length; i += chunkSize) {
    const chunk = typedLeads.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (lead) => {
        try {
          const copy = await generateMessage(lead);
          await supabase
            .from("leads")
            .update({
              ai_subject: copy.subject,
              ai_personalized_message: copy.fullMessage,
            })
            .eq("id", lead.id);
          generatedCount++;
        } catch (e) {
          console.error("Erreur génération message lead", lead.id, e);
        }
      }),
    );
  }

  revalidatePath("/campaigns");
  revalidatePath("/leads");
  return { success: true, generatedCount };
}

/**
 * Phase 5 : Modification manuelle du message personnalisé d'un lead
 */
export async function updateLeadMessage(leadId: string, subject: string, message: string) {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("leads")
    .update({
      ai_subject: subject.trim(),
      ai_personalized_message: message.trim(),
    })
    .eq("id", leadId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { success: true };
}
