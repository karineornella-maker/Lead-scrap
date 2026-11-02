import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Megaphone, Plus, Sparkles, Database, ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { CampaignStatusBadge } from "@/components/status-badges";
import { CampaignActionButtons } from "./campaign-actions";
import { findCountry } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Campaign } from "@/lib/types";

export const metadata = { title: "Campagnes X-Ray · Leadora" };

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospection & Campagnes"
        description="Gérez vos critères de ciblage Google X-Ray, lancez les scrapers gratuits et suivez les imports de profils qualifiés diaspora."
        actions={
          <Link
            href="/campaigns/new"
            className={buttonVariants({
              size: "sm",
              className:
                "h-9 gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold px-4 shadow-sm shadow-orange-600/25 transition-transform hover:scale-[1.02]",
            })}
          >
            <Plus className="size-4 stroke-[2.5]" />
            Nouvelle campagne
          </Link>
        }
      />

      <Card className="rounded-2xl border-border bg-card p-0 overflow-hidden shadow-xs card-hover-lift">
        <Suspense fallback={<p className="p-8 text-sm text-muted-foreground font-medium">Chargement des campagnes…</p>}>
          <CampaignTable />
        </Suspense>
      </Card>
    </div>
  );
}

type CampaignRow = Campaign & { leads: { count: number }[] };

async function CampaignTable() {
  await connection();
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("campaigns")
    .select("*, leads(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="p-8 text-sm text-destructive">Erreur de chargement : {error.message}</p>;
  }
  const data = rows as CampaignRow[];

  if (!data.length) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
          <Megaphone className="size-7" />
        </div>
        <p className="text-base font-bold text-foreground">Aucune campagne pour l&apos;instant</p>
        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
          Créez votre première campagne pour extraire instantanément des profils cibles de la diaspora africaine et professionnels BRVM.
        </p>
        <Link
          href="/campaigns/new"
          className={buttonVariants({
            size: "sm",
            className: "mt-3 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold px-4",
          })}
        >
          Créer la première campagne
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/40 border-b border-border">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Campagne</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pays</TableHead>
            <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Univ.</TableHead>
            <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Groupes</TableHead>
            <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Objectif</TableHead>
            <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Leads Importés</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Statut</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
            <TableHead className="text-right pr-6 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/60">
          {data.map((c) => (
            <TableRow key={c.id} className="group hover:bg-muted/30 transition-colors">
              <TableCell className="pl-6 font-semibold text-xs py-4">
                <Link
                  href={`/leads?campaign=${c.id}`}
                  className="font-bold text-foreground group-hover:text-orange-600 transition-colors underline-offset-4 hover:underline flex items-center gap-1.5"
                >
                  <span className="text-[13px]">{c.name}</span>
                  <ArrowUpRight className="size-3 text-muted-foreground/50 group-hover:text-orange-600 transition-colors" />
                </Link>
              </TableCell>
              <TableCell className="text-xs font-medium text-muted-foreground py-4">
                <Link href={`/leads?campaign=${c.id}`} className="block w-full h-full hover:text-foreground">
                  {findCountry(c.target_country)?.country.name ?? c.target_country}
                </Link>
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-muted-foreground py-4">
                <Link href={`/leads?campaign=${c.id}`} className="block w-full h-full hover:text-foreground">
                  {c.target_universities.length}
                </Link>
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-muted-foreground py-4">
                <Link href={`/leads?campaign=${c.id}`} className="block w-full h-full hover:text-foreground">
                  {c.target_groups.length}
                </Link>
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-muted-foreground py-4">
                <Link href={`/leads?campaign=${c.id}`} className="block w-full h-full hover:text-foreground">
                  {c.batch_size}
                </Link>
              </TableCell>
              <TableCell className="text-right py-4">
                <Link
                  href={`/leads?campaign=${c.id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono font-extrabold text-xs hover:bg-orange-600 hover:text-white transition-all shadow-2xs"
                  title="Accéder directement à cette campagne dans la liste des leads"
                >
                  {c.leads[0]?.count ?? 0} leads
                </Link>
              </TableCell>
              <TableCell className="py-4">
                <Link href={`/leads?campaign=${c.id}`} className="block">
                  <CampaignStatusBadge status={c.status} />
                </Link>
              </TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground py-4">
                <Link href={`/leads?campaign=${c.id}`} className="block w-full h-full">
                  {new Date(c.created_at).toLocaleDateString("fr-FR")}
                </Link>
              </TableCell>
              <TableCell className="pr-6 text-right py-4">
                <CampaignActionButtons
                  campaignId={c.id}
                  status={c.status}
                  hasApifyRun={Boolean(c.apify_run_id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
