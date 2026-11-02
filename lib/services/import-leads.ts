import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchRunResults, parseLinkedInResult } from "./apify";
import { scoreLead } from "./scoring";
import { MIN_UEMOA_SCORE, universityName } from "@/lib/data";
import type { Campaign } from "@/lib/types";

export interface ImportSummary {
  fetched: number;
  parsed: number;
  qualified: number;
  suppressed: number;
  inserted: number;
}

export async function importRun(campaignId: string, runId: string): Promise<ImportSummary> {
  const supabase = createAdminClient();

  // 1. Récupération des informations de la campagne
  const { data: campaign, error: campError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (campError || !campaign) {
    throw new Error(`Campagne introuvable : ${campError?.message || campaignId}`);
  }

  const typedCampaign = campaign as Campaign;

  try {
    // 2. Récupération des résultats bruts d'Apify
    const rawResults = await fetchRunResults(runId);
    let parsedCount = 0;
    let qualifiedCount = 0;
    let suppressedCount = 0;

    // 3. Récupération de la liste d'exclusion (suppression list)
    const { data: suppressionRows } = await supabase
      .from("suppression_list")
      .select("email, linkedin_url");

    const suppressedUrls = new Set(
      (suppressionRows || []).map((r) => r.linkedin_url?.toLowerCase()).filter(Boolean),
    );

    // Détermination de la formation occidentale cible associée à la campagne
    const westernEdu =
      typedCampaign.target_universities.length > 0
        ? typedCampaign.target_universities.map(universityName).join(", ")
        : null;

    const leadsToInsert = [];

    for (const raw of rawResults) {
      const parsed = parseLinkedInResult(raw);
      if (!parsed) continue;
      parsedCount++;

      // Vérification liste d'exclusion
      if (suppressedUrls.has(parsed.linkedin_url.toLowerCase())) {
        suppressedCount++;
        continue;
      }

      // 4. Calcul du score d'affinité UEMOA déterministe
      const scoreRes = scoreLead({
        title: parsed.current_title,
        snippet: parsed.source_snippet,
        education: westernEdu,
        groups: typedCampaign.target_groups,
      });

      // Minimisation des données : on ne stocke que les leads au-dessus du seuil (30)
      if (scoreRes.score < MIN_UEMOA_SCORE) {
        continue;
      }
      qualifiedCount++;

      leadsToInsert.push({
        campaign_id: campaignId,
        name: parsed.full_name,
        full_name: parsed.full_name,
        first_name: parsed.first_name,
        last_name: parsed.last_name,
        current_title: parsed.current_title,
        current_company: parsed.current_company,
        linkedin_url: parsed.linkedin_url,
        western_education: westernEdu,
        uemoa_ties: scoreRes.ties.join(" · ") || null,
        uemoa_affinity_score: scoreRes.score,
        source_snippet: parsed.source_snippet,
        email_status: "pending",
      });
    }

    // 5. Insertion / Upsert avec ignoreDuplicates sur linkedin_url
    let insertedCount = 0;
    if (leadsToInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("leads")
        .upsert(leadsToInsert, { onConflict: "linkedin_url", ignoreDuplicates: true })
        .select("id");

      if (insertError) {
        console.error("Erreur insertion leads:", insertError);
        throw new Error(`Erreur lors de l'enregistrement des leads : ${insertError.message}`);
      } else {
        insertedCount = inserted?.length ?? leadsToInsert.length;
      }
    }

    // 6. Mise à jour de la campagne en completed
    await supabase
      .from("campaigns")
      .update({
        status: "completed",
        last_error: null,
      })
      .eq("id", campaignId);

    return {
      fetched: rawResults.length,
      parsed: parsedCount,
      qualified: qualifiedCount,
      suppressed: suppressedCount,
      inserted: insertedCount,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("campaigns")
      .update({
        status: "draft",
        last_error: message,
      })
      .eq("id", campaignId);
    throw err;
  }
}

