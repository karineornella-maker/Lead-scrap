import Link from "next/link";
import {
  TrendingUp,
  Send,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  ArrowRight,
  Database,
  Users,
  ShieldCheck,
  Zap,
  Mail,
  Bot,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { OverviewChart } from "./overview-chart";

export const metadata = {
  title: "Dashboard Overview · Leadora",
};

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* Hero / Greeting Bar & Copywriting */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cockpit Prospection BRVM
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Bonjour, Les Frères Martins
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Voici l&apos;état en temps réel de vos campagnes diaspora UEMOA et de vos envois d&apos;outreach.
          </p>
        </div>

        {/* Top 3 Summary KPIs */}
        <div className="flex items-center gap-6 self-start rounded-2xl border border-border bg-card/80 px-5 py-2.5 shadow-xs backdrop-blur-sm lg:self-auto card-hover-lift">
          <div className="text-right">
            <span className="block text-xl font-extrabold leading-tight tabular-nums font-mono text-foreground">303</span>
            <span className="text-[11px] font-semibold text-muted-foreground">leads qualifiés</span>
          </div>
          <div className="h-8 w-px bg-border/80" />
          <div className="text-right">
            <span className="block text-xl font-extrabold leading-tight tabular-nums font-mono text-emerald-600 dark:text-emerald-400">
              83
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">emails pros</span>
          </div>
          <div className="h-8 w-px bg-border/80" />
          <div className="text-right">
            <span className="block text-xl font-extrabold leading-tight tabular-nums font-mono text-orange-600 dark:text-orange-400">
              0 €
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">dépense outils</span>
          </div>
        </div>
      </div>

      {/* Copywriting Banner - Leadora B2B Prospecting */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100/40 p-6 dark:border-orange-500/20 dark:from-orange-950/30 dark:via-zinc-900 dark:to-orange-950/20 shadow-xs card-hover-lift">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-600/10 px-3 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                <Sparkles className="size-3.5 fill-orange-500 text-orange-500" />
                Pipeline Intelligent Diaspora Africaine
              </span>
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                RGPD Art. 9 Conforme
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground max-w-2xl leading-relaxed">
              Ciblez les directeurs financiers, auditeurs et banquiers de la diaspora (Canada, France, Belgique, USA) avec des critères académiques et professionnels stricts.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/campaigns/new"
              className={buttonVariants({
                size: "sm",
                className:
                  "h-9.5 gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 px-5 text-xs font-bold text-white shadow-sm shadow-orange-600/25 transition-transform hover:scale-[1.02]",
              })}
            >
              Nouveau ciblage X-Ray
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 KPI Metric Cards with Mini Bar Charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 : Leads trouvés */}
        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold text-foreground">Leads Diaspora</span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-3" />
              100% Qualifié
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-foreground tracking-tight">303</span>
            <span className="text-xs text-muted-foreground font-medium">3 campagnes actives</span>
          </div>
          <div className="mt-4 flex items-end gap-1.5 h-8">
            <div className="w-1/6 bg-orange-500/20 rounded-md h-[40%]" />
            <div className="w-1/6 bg-orange-500/30 rounded-md h-[55%]" />
            <div className="w-1/6 bg-orange-500/40 rounded-md h-[70%]" />
            <div className="w-1/6 bg-orange-500/60 rounded-md h-[60%]" />
            <div className="w-1/6 bg-orange-500/80 rounded-md h-[85%]" />
            <div className="w-1/6 bg-orange-600 rounded-md h-[100%]" />
          </div>
        </Card>

        {/* Metric 2 : Emails Pro Vérifiés */}
        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold text-foreground">Emails Pro Vérifiés</span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3" />
              Directeurs & Banques
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-foreground tracking-tight">83</span>
            <span className="text-xs text-muted-foreground font-medium">NBC, BMO, PwC, EY...</span>
          </div>
          <div className="mt-4 flex items-end gap-1.5 h-8">
            <div className="w-1/6 bg-emerald-500/20 rounded-md h-[30%]" />
            <div className="w-1/6 bg-emerald-500/30 rounded-md h-[45%]" />
            <div className="w-1/6 bg-emerald-500/50 rounded-md h-[65%]" />
            <div className="w-1/6 bg-emerald-500/70 rounded-md h-[75%]" />
            <div className="w-1/6 bg-emerald-500/85 rounded-md h-[80%]" />
            <div className="w-1/6 bg-emerald-600 rounded-md h-[100%]" />
          </div>
        </Card>

        {/* Metric 3 : Export Waalaxy Compatible */}
        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold text-foreground">Export Waalaxy & Excel</span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
              Prêt à injecter
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-foreground tracking-tight">CSV (,)</span>
            <span className="text-xs text-muted-foreground font-medium">UTF-8 BOM Validé</span>
          </div>
          <div className="mt-4 flex items-end gap-1.5 h-8">
            <div className="w-1/6 bg-blue-500/20 rounded-md h-[50%]" />
            <div className="w-1/6 bg-blue-500/30 rounded-md h-[60%]" />
            <div className="w-1/6 bg-blue-500/40 rounded-md h-[70%]" />
            <div className="w-1/6 bg-blue-500/60 rounded-md h-[80%]" />
            <div className="w-1/6 bg-blue-500/80 rounded-md h-[90%]" />
            <div className="w-1/6 bg-blue-600 rounded-md h-[100%]" />
          </div>
        </Card>

        {/* Metric 4 : Assistant IA Frères Martins */}
        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs card-hover-lift">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold text-foreground">Assistant IA Auto-Reply</span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <Bot className="size-3" />
              Zéro Appel
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-foreground tracking-tight">24h/24</span>
            <span className="text-xs text-muted-foreground font-medium">Réponses IMAP Auto</span>
          </div>
          <div className="mt-4 flex items-end gap-1.5 h-8">
            <div className="w-1/6 bg-amber-500/20 rounded-md h-[40%]" />
            <div className="w-1/6 bg-amber-500/30 rounded-md h-[50%]" />
            <div className="w-1/6 bg-amber-500/50 rounded-md h-[70%]" />
            <div className="w-1/6 bg-amber-500/70 rounded-md h-[80%]" />
            <div className="w-1/6 bg-amber-500/85 rounded-md h-[95%]" />
            <div className="w-1/6 bg-amber-600 rounded-md h-[100%]" />
          </div>
        </Card>
      </div>

      {/* Graphique d'activité & Campagnes Récentes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border bg-card p-6 shadow-xs lg:col-span-2 card-hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Activité de Prospection Hebdomadaire</h2>
              <p className="text-xs text-muted-foreground">Volume de leads extraits et enrichis sur les 7 derniers jours.</p>
            </div>
          </div>
          <OverviewChart />
        </Card>

        {/* Liens Rapides & Actions Frères Martins */}
        <Card className="rounded-2xl border-border bg-card p-6 shadow-xs space-y-4 card-hover-lift">
          <h2 className="text-base font-bold text-foreground">Accès Rapides</h2>
          <div className="space-y-2.5">
            <Link
              href="/leads?campaign=f1ebffb7-7d60-4354-a09b-5ee5010124c1"
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-2 rounded-full bg-orange-500" />
                <span className="text-xs font-bold text-foreground">Canada (231 leads)</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>

            <Link
              href="/leads?campaign=4d7b2354-1fe5-412f-9817-488663486ae0"
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-2 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-foreground">CANADA 2 (39 leads)</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>

            <Link
              href="/leads?campaign=ca1b7ba9-9599-4d2a-a925-534bc3d674ce"
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-foreground">FRANCE CAMPAGNE (33 leads)</span>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>

            <Link
              href="/outreach"
              className="flex items-center justify-between p-3 rounded-xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-colors mt-2"
            >
              <div className="flex items-center gap-2.5">
                <Send className="size-3.5 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-bold text-orange-700 dark:text-orange-300">Lancer un lot d&apos;emails (10-25)</span>
              </div>
              <ArrowRight className="size-3.5 text-orange-600" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
