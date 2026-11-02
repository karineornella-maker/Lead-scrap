"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Bell, ChevronRight, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  const pathname = usePathname();

  const getPageInfo = () => {
    if (pathname === "/overview") return { title: "Tableau de Bord", section: "Vue Générale" };
    if (pathname.startsWith("/campaigns/new")) return { title: "Nouveau Ciblage Google X-Ray", section: "Campagnes" };
    if (pathname.startsWith("/campaigns")) return { title: "Prospection & Campagnes", section: "Ciblage" };
    if (pathname.startsWith("/leads/")) return { title: "Fiche Lead Détaillée", section: "Leads" };
    if (pathname.startsWith("/leads")) return { title: "Base de Leads Qualifiés", section: "Leads" };
    if (pathname.startsWith("/outreach")) return { title: "Outreach & Campagnes Email", section: "Prospection" };
    if (pathname.startsWith("/assistant")) return { title: "Assistant IA Martins", section: "Automatisation" };
    return { title: "Leadora", section: "Dashboard" };
  };

  const { title, section } = getPageInfo();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/85 px-4 sm:px-6 backdrop-blur-md transition-all">
      {/* Fil d'Ariane épuré & Title */}
      <div className="flex items-center gap-2">
        <Link
          href="/overview"
          className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          {section}
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/40" />
        <span className="text-sm font-bold text-foreground tracking-tight">{title}</span>
      </div>

      {/* Actions Utilitaires Droite */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Badge Conformité RGPD */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="size-3.5" />
          <span>RGPD Art. 9 Conforme</span>
        </div>

        {/* Bouton Assistant IA Rapide */}
        <Link href="/assistant">
          <Button
            variant="outline"
            size="sm"
            className="h-8.5 gap-1.5 rounded-xl border-orange-500/30 bg-orange-500/5 px-3 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 shadow-2xs"
          >
            <Sparkles className="size-3.5 fill-orange-500 text-orange-500" />
            <span className="hidden sm:inline">IA Auto-Reply</span>
          </Button>
        </Link>

        {/* Bascule Mode Sombre / Clair */}
        <ThemeToggle />

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-transform hover:scale-105"
          title="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-orange-600 animate-pulse ring-2 ring-background" />
        </Button>

        {/* Avatar Profil */}
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-amber-300 text-xs font-extrabold text-white shadow-sm ring-2 ring-border">
          LM
        </div>
      </div>
    </header>
  );
}
