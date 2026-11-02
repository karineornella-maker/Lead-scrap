import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { AssistantClient } from "./assistant-client";

export const metadata = { title: "Assistante IA Réponse · Les Frères Martins" };

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistante Virtuelle IA · Les Frères Martins"
        description="Réponse automatique 100% autonome à vos emails : détection des réponses reçues, rédaction dans votre style fraternel, invitations au webinar et vidéos pédagogiques sans aucun appel."
      />

      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement de votre assistante…</p>}>
        <AssistantView />
      </Suspense>
    </div>
  );
}

async function AssistantView() {
  await connection();
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, full_name, first_name, current_company, current_title, business_email, email")
    .order("uemoa_affinity_score", { ascending: false })
    .limit(300);

  return <AssistantClient leads={leads || []} />;
}

