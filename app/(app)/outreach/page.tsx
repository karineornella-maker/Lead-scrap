import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { OutreachPanel } from "./outreach-panel";

export const metadata = { title: "Outreach & Envoi Sécurisé · Leadora" };

export default function OutreachPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Outreach Sécurisé par Lots"
        description="Envoyez vos emails de prospection par tranches raisonnables avec espacement anti-spam, 100% gratuit et sans risque."
      />

      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement des données outreach…</p>}>
        <OutreachView />
      </Suspense>
    </div>
  );
}

async function OutreachView() {
  await connection();
  const supabase = await createClient();

  // 1. Récupération des campagnes
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .order("created_at", { ascending: false });

  // 2. Statistiques des leads
  const { data: leads } = await supabase
    .from("leads")
    .select("id, email_status, raw");

  const allLeads = leads || [];
  const verifiedLeads = allLeads.filter(
    (l) => l.email_status === "verified" || l.email_status === "risky",
  );

  const sentLeads = verifiedLeads.filter((l) => {
    const raw = (l.raw as Record<string, unknown>) || {};
    const outreach = raw.outreach as Record<string, unknown> | undefined;
    return outreach && outreach.status === "sent";
  });

  return (
    <OutreachPanel
      totalVerifiedLeads={verifiedLeads.length}
      totalSentLeads={sentLeads.length}
      campaigns={campaigns || []}
    />
  );
}

