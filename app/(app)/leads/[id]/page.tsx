import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  Building,
  MapPin,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EmailStatusBadge, ScoreBadge } from "@/components/status-badges";
import { createClient } from "@/lib/supabase/server";
import { LeadEditor } from "./lead-editor";
import type { Lead } from "@/lib/types";

interface LeadPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LeadPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: lead } = await supabase.from("leads").select("full_name").eq("id", id).single();
  return {
    title: lead ? `${lead.full_name} · Fiche Prospect Leadora` : "Fiche Prospect",
  };
}

export default function LeadDetailPage({ params }: LeadPageProps) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted-foreground font-medium">Chargement de la fiche prospect…</p>}>
      <LeadDetailContent params={params} />
    </Suspense>
  );
}

async function LeadDetailContent({ params }: LeadPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*, campaigns(name)")
    .eq("id", id)
    .single();

  if (error || !lead) {
    notFound();
  }

  const typedLead = lead as Lead & { campaigns?: { name: string } | null };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Barre de retour et fil d'Ariane */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/leads"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "gap-1.5 rounded-xl text-xs font-semibold hover:bg-muted",
            })}
          >
            <ArrowLeft className="size-4" />
            Retour à la liste des leads
          </Link>
          {typedLead.campaigns?.name && (
            <span className="text-xs font-medium text-muted-foreground">
              Campagne : <strong className="text-foreground font-bold">{typedLead.campaigns.name}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {typedLead.linkedin_url && (
            <a
              href={typedLead.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-8.5 gap-1.5 rounded-xl border-border text-xs font-semibold hover:bg-muted",
              })}
            >
              <span>Voir le profil LinkedIn</span>
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Colonne de gauche : Profil & Attributs Fatuels */}
        <Card className="rounded-2xl border-border bg-card p-6 md:col-span-1 space-y-6 shadow-xs card-hover-lift">
          <div>
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-amber-300 font-extrabold text-white text-lg shadow-sm mb-4">
              {typedLead.first_name?.[0] || typedLead.full_name?.[0] || "P"}
            </div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">{typedLead.full_name}</h1>
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
              {typedLead.current_title || "Professionnel Financier"}
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            {typedLead.current_company && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Building className="size-4 shrink-0 text-muted-foreground/70" />
                <span className="text-foreground font-bold">{typedLead.current_company}</span>
              </div>
            )}
            {typedLead.location && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-muted-foreground/70" />
                <span className="font-medium text-foreground">{typedLead.location}</span>
              </div>
            )}
            {typedLead.western_education && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <GraduationCap className="size-4 shrink-0 text-muted-foreground/70" />
                <span className="font-medium text-foreground">{typedLead.western_education}</span>
              </div>
            )}
            {typedLead.business_email && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="font-mono text-xs font-semibold text-foreground truncate">
                  {typedLead.business_email}
                </span>
              </div>
            )}
          </div>

          {/* Section Score & RGPD */}
          <div className="pt-4 border-t border-border/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Score d&apos;affinité :</span>
              <ScoreBadge score={typedLead.uemoa_affinity_score} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Statut Email :</span>
              <EmailStatusBadge status={typedLead.email_status} />
            </div>

            {typedLead.uemoa_ties && (
              <div className="mt-3 rounded-xl bg-orange-500/10 p-3 text-xs border border-orange-500/20">
                <p className="font-bold text-orange-700 dark:text-orange-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  Liens UEMOA Factuels (RGPD Art. 9) :
                </p>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  {typedLead.uemoa_ties}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Colonne de droite : Messages d'Approche Personnalisés IA */}
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border bg-card p-6 shadow-xs card-hover-lift">
            <div className="flex items-center justify-between pb-4 border-b border-border/70">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="size-4 text-orange-500 fill-orange-500" />
                  Accroche & Message Personnalisé IA
                </h2>
                <p className="text-xs text-muted-foreground">
                  Généré avec le persona des Frères Martins (Vouvoiement chaleureux, webinaire 8 novembre, invitation naturelle).
                </p>
              </div>
            </div>

            <div className="mt-5">
              <LeadEditor
                leadId={typedLead.id}
                initialSubject={typedLead.ai_subject || ""}
                initialMessage={typedLead.ai_personalized_message || ""}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
