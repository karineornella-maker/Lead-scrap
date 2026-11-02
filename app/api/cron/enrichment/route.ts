import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { dropcontactProvider } from "@/lib/services/enrichment/dropcontact";
import { harvestApiProvider } from "@/lib/services/enrichment/harvestapi";
import type { EnrichmentJob } from "@/lib/types";

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  const expectedSecret = process.env.CRON_SECRET;
  const isAuthorized =
    !expectedSecret ||
    authHeader === `Bearer ${expectedSecret}` ||
    secret === expectedSecret;

  if (!isAuthorized) {
    return new NextResponse("Non autorisé (CRON_SECRET invalide)", { status: 401 });
  }

  const supabase = createAdminClient();

  // Récupération des jobs en attente
  const { data: jobs, error } = await supabase
    .from("enrichment_jobs")
    .select("*")
    .eq("status", "pending")
    .limit(20);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const typedJobs = (jobs || []) as EnrichmentJob[];
  let processedJobs = 0;
  let updatedLeads = 0;

  for (const job of typedJobs) {
    try {
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

            await supabase
              .from("leads")
              .update(updatePayload)
              .eq("id", item.leadId);

            updatedLeads++;
          }

          await supabase
            .from("enrichment_jobs")
            .update({ status: pollRes.error ? "failed" : "completed" })
            .eq("id", job.id);

          processedJobs++;
        }
      } else if (job.provider === "dropcontact") {
        const pollRes = await dropcontactProvider.poll(job.external_id);

        if (pollRes.completed) {
          // Mise à jour des leads enrichis
          for (const item of pollRes.results) {
            const updatePayload: { business_email?: string | null; email?: string | null; email_status: string } = {
              email_status: item.status,
            };
            if (item.email) {
              updatePayload.business_email = item.email;
              updatePayload.email = item.email;
            }

            await supabase
              .from("leads")
              .update(updatePayload)
              .eq("id", item.leadId);

            updatedLeads++;
          }

          // Marquer le job comme terminé
          await supabase
            .from("enrichment_jobs")
            .update({ status: "completed" })
            .eq("id", job.id);

          processedJobs++;
        }
      }
    } catch (err) {
      console.error(`Erreur sur le job ${job.id}:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    processedJobs,
    updatedLeads,
    pendingJobs: typedJobs.length - processedJobs,
  });
}

