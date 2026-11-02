import { Suspense } from "react";
import { connection } from "next/server";
import Form from "next/form";
import Link from "next/link";
import {
  Download,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  Flame,
  Search,
  Users,
  X,
  Edit3,
  Mail,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { EmailStatusBadge, ScoreBadge, emailStatusLabels } from "@/components/status-badges";
import { parseFilters, buildLeadsQuery, type SearchParams } from "@/lib/leads-query";
import { createClient } from "@/lib/supabase/server";
import { LeadsEnrichButton } from "./leads-enrich-button";
import { CampaignSelectFilter } from "./campaign-select-filter";
import type { Lead } from "@/lib/types";

export const metadata = { title: "Leads Qualifiés · Leadora" };

const PAGE_LIMIT = 500;

const selectClass =
  "h-9 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 shadow-2xs";

function LinkedInIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export default function LeadsPage({ searchParams }: PageProps<"/leads">) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<p className="text-sm text-muted-foreground font-medium">Chargement des filtres…</p>}>
        <LeadsView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LeadsView({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const supabase = await createClient();

  const query = buildLeadsQuery(supabase, filters, PAGE_LIMIT);

  const [campaignsRes, leadsRes] = await Promise.all([
    supabase.from("campaigns").select("id, name").order("created_at", { ascending: false }),
    query,
  ]);

  if (leadsRes.error) {
    return <p className="text-sm text-destructive">Erreur de chargement : {leadsRes.error.message}</p>;
  }

  const campaigns = campaignsRes.data ?? [];
  const leads = (leadsRes.data ?? []) as Lead[];
  const selectedCampaignObj = campaigns.find((c) => c.id === filters.campaign);
  const pageTitle = selectedCampaignObj ? `Campagne : ${selectedCampaignObj.name}` : "Base de Leads Qualifiés";
  const pageSubtitle = selectedCampaignObj
    ? `Affichage des ${leads.length} profils de la campagne "${selectedCampaignObj.name}". Filtrés par score d'affinité, emails résolus et signaux récents.`
    : "Profils qualifiés diaspora & BRVM : diplômes occidentaux vérifiés, liens UEMOA factuels et emails professionnels résolus.";

  const hasFilters = Boolean(
    filters.campaign ||
    filters.emailStatus ||
    filters.minScore ||
    filters.school ||
    filters.keyword ||
    filters.recentPost,
  );

  // Construction de l'URL d'export avec les filtres actuels (compatible Waalaxy & Excel)
  const exportParams = new URLSearchParams();
  if (filters.campaign) exportParams.set("campaign", filters.campaign);
  if (filters.emailStatus) exportParams.set("email", filters.emailStatus);
  if (filters.minScore > 0) exportParams.set("score", String(filters.minScore));
  if (filters.school) exportParams.set("school", filters.school);
  if (filters.keyword) exportParams.set("keyword", filters.keyword);
  if (filters.recentPost) exportParams.set("recent_post", "1");

  const waalaxyExportParams = new URLSearchParams(exportParams);
  waalaxyExportParams.set("format", "waalaxy");
  const waalaxyExportUrl = `/api/export?${waalaxyExportParams.toString()}`;

  const csvExportParams = new URLSearchParams(exportParams);
  csvExportParams.set("format", "csv");
  const csvExportUrl = `/api/export?${csvExportParams.toString()}`;

  const xlsxExportParams = new URLSearchParams(exportParams);
  xlsxExportParams.set("format", "xlsx");
  const xlsxExportUrl = `/api/export?${xlsxExportParams.toString()}`;

  return (
    <>
      <PageHeader
        title={pageTitle}
        description={pageSubtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <LeadsEnrichButton campaignId={filters.campaign || undefined} />

            <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

            <a
              href={waalaxyExportUrl}
              download
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-9 gap-1.5 rounded-xl border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-bold shadow-2xs transition-transform hover:scale-[1.02]",
              })}
              title="Export CSV au format exact Waalaxy (séparateur virgule, colonnes : URL LinkedIn, Email, Email Pro, Prénom, Nom, Message)"
            >
              <Download className="size-3.5" />
              Waalaxy CSV (,)
            </a>

            <a
              href={csvExportUrl}
              download
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-9 gap-1.5 rounded-xl border-border text-xs font-medium hover:bg-muted",
              })}
              title="Export CSV standard (séparateur point-virgule pour Excel)"
            >
              <Download className="size-3.5" />
              CSV Excel (;)
            </a>

            <a
              href={xlsxExportUrl}
              download
              className={buttonVariants({
                size: "sm",
                className:
                  "h-9 gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-transform hover:scale-[1.02]",
              })}
            >
              <FileSpreadsheet className="size-3.5" />
              Excel (.xlsx)
            </a>
          </div>
        }
      />

      {/* Barre de filtres avancés */}
      <Card className="rounded-2xl border-border bg-card p-4 shadow-xs">
        <Form
          action="/leads"
          className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6"
        >
          {/* Mot-clé libre */}
          <div className="grid gap-1.5 lg:col-span-2">
            <Label htmlFor="f-keyword" className="text-xs font-bold text-foreground">
              Recherche par mot-clé
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                id="f-keyword"
                name="keyword"
                defaultValue={filters.keyword}
                placeholder="Ex : DAF, HEC, M&A, Private Equity, Deloitte..."
                className="h-9 pl-8 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* Campagne - Client Component */}
          <div className="grid gap-1.5">
            <Label htmlFor="f-campaign" className="text-xs font-bold text-foreground">
              Campagne
            </Label>
            <CampaignSelectFilter
              campaigns={campaigns}
              defaultValue={filters.campaign}
              selectClass={selectClass}
            />
          </div>

          {/* Statut email */}
          <div className="grid gap-1.5">
            <Label htmlFor="f-email" className="text-xs font-bold text-foreground">
              Statut email
            </Label>
            <select
              id="f-email"
              name="email"
              defaultValue={filters.emailStatus}
              className={selectClass}
            >
              <option value="">Tous les statuts</option>
              {Object.entries(emailStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Activité récente (Post LinkedIn) */}
          <div className="grid gap-1.5">
            <Label htmlFor="f-post" className="text-xs font-bold text-foreground">
              Activité LinkedIn
            </Label>
            <select
              id="f-post"
              name="recent_post"
              defaultValue={filters.recentPost ? "1" : ""}
              className={selectClass}
            >
              <option value="">Toute activité</option>
              <option value="1">🔥 Post récent LinkedIn</option>
            </select>
          </div>

          {/* Boutons d'action de filtre */}
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="h-9 gap-1.5 rounded-xl px-4 text-xs font-bold w-full bg-foreground text-background hover:bg-foreground/90 shadow-2xs">
              <Filter className="size-3.5" />
              Filtrer
            </Button>
            {hasFilters && (
              <Link
                href="/leads"
                className={buttonVariants({ variant: "ghost", size: "icon", className: "h-9 w-9 shrink-0 rounded-xl" })}
                aria-label="Réinitialiser"
              >
                <X className="size-4" />
              </Link>
            )}
          </div>
        </Form>
      </Card>

      {/* Table des Leads Qualifiés */}
      <Card className="rounded-2xl border-border bg-card p-0 overflow-hidden shadow-xs card-hover-lift">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Users className="size-7" />
            </div>
            <p className="text-base font-bold text-foreground">Aucun lead qualifié trouvé</p>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              {hasFilters
                ? "Aucun profil ne correspond exactement à vos critères de filtrage."
                : "Lancez une extraction depuis la page Prospection pour collecter vos premiers leads."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-48">Prospect & Profil</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-48">Poste & Entreprise</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Activité</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-40">Formation Occidentale</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-48">Liens UEMOA Factuels</TableHead>
                  <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Score</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-44">Email Pro</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Statut</TableHead>
                  <TableHead className="text-right pr-6 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Fiche</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="group hover:bg-muted/30 transition-colors">
                    {/* Nom + Lien LinkedIn complet */}
                    <TableCell className="pl-6 py-3.5 font-medium text-xs">
                      <div className="space-y-1">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-bold text-foreground group-hover:text-orange-600 transition-colors block text-[13px]"
                        >
                          {lead.full_name}
                        </Link>
                        {lead.linkedin_url && (
                          <a
                            href={lead.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A66C2] hover:underline"
                            title={lead.linkedin_url}
                          >
                            <LinkedInIcon className="size-3 text-[#0A66C2]" />
                            <span>LinkedIn</span>
                            <ExternalLink className="size-2.5 opacity-60" />
                          </a>
                        )}
                      </div>
                    </TableCell>

                    {/* Poste & Entreprise */}
                    <TableCell className="max-w-60 truncate text-xs py-3.5">
                      <span className="font-semibold text-foreground block truncate">{lead.current_title ?? "—"}</span>
                      {lead.current_company && (
                        <span className="block text-[11px] font-medium text-muted-foreground truncate mt-0.5">
                          {lead.current_company}
                        </span>
                      )}
                    </TableCell>

                    {/* Activité récente */}
                    <TableCell className="text-xs whitespace-nowrap py-3.5">
                      {lead.has_recent_post ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400"
                          title="A publié récemment sur LinkedIn"
                        >
                          <Flame className="size-3 fill-amber-500 text-amber-500" />
                          Post récent
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70 text-[11px]">Standard</span>
                      )}
                    </TableCell>

                    {/* Formation */}
                    <TableCell className="max-w-44 truncate text-xs text-muted-foreground py-3.5 font-medium">
                      {lead.western_education ? (
                        <div className="flex items-center gap-1.5 truncate" title={lead.western_education}>
                          <GraduationCap className="size-3.5 shrink-0 text-muted-foreground/60" />
                          <span className="truncate">{lead.western_education}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    {/* Liens UEMOA factuels */}
                    <TableCell className="max-w-56 truncate text-xs text-muted-foreground py-3.5 font-medium">
                      {lead.uemoa_ties ? (
                        <span className="truncate block" title={lead.uemoa_ties}>
                          {lead.uemoa_ties}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    {/* Score d'affinité */}
                    <TableCell className="text-right py-3.5">
                      <ScoreBadge score={lead.uemoa_affinity_score} />
                    </TableCell>

                    {/* Email pro */}
                    <TableCell className="text-xs py-3.5">
                      {lead.business_email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-mono text-[11px] font-medium text-foreground truncate max-w-48 block" title={lead.business_email}>
                            {lead.business_email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60 italic font-mono">
                          Non enrichi
                        </span>
                      )}
                    </TableCell>

                    {/* Statut email */}
                    <TableCell className="py-3.5">
                      <EmailStatusBadge status={lead.email_status} />
                    </TableCell>

                    {/* Bouton Fiche */}
                    <TableCell className="pr-6 text-right py-3.5">
                      <Link
                        href={`/leads/${lead.id}`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                          className: "h-7 gap-1 rounded-lg text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground",
                        })}
                      >
                        <Edit3 className="size-3" />
                        Ouvrir
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
}
