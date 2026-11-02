"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Search,
  Sparkles,
  MailCheck,
  Send,
  CreditCard,
  Settings,
  Globe,
  Zap,
  LogOut,
  SlidersHorizontal,
  Bot,
  ExternalLink,
} from "lucide-react";
import { signOut } from "@/app/login/actions";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  userEmail?: string | null;
}

const mainNavItems = [
  { href: "/overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campagnes X-Ray", icon: SlidersHorizontal },
  { href: "/leads", label: "Leads Qualifiés", icon: Users, badge: "300+" },
  { href: "/outreach", label: "Outreach & Envois", icon: Send, badge: "Lots" },
  { href: "/assistant", label: "Assistant IA", icon: Bot, badge: "Nouveau" },
];

const secondaryNavItems = [
  { href: "/campaigns/new", label: "Nouveau ciblage", icon: Sparkles },
  { href: "/leads?email=verified", label: "Emails Vérifiés", icon: MailCheck },
];

const accountNavItems = [
  { href: "#", label: "Crédits & Quotas", icon: CreditCard },
  { href: "#", label: "Paramètres SMTP", icon: Settings },
];

export function AppSidebar({ userEmail }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar/95 px-4 py-5 backdrop-blur-md lg:flex transition-all">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 pb-6">
        <div className="relative flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-amber-300 shadow-md shadow-orange-500/25 transition-transform hover:scale-105">
          <div className="size-3.5 rounded-lg bg-white shadow-xs" />
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold tracking-tight text-lg leading-tight text-sidebar-foreground">
            Leadora
          </span>
          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            BRVM B2B PRO
          </span>
        </div>
      </div>

      {/* Quick Search Input */}
      <div className="px-1 pb-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 size-3.5 text-muted-foreground/80" />
          <input
            type="text"
            placeholder="Rechercher lead, poste..."
            className="h-9 w-full rounded-xl border border-sidebar-border bg-card/60 pl-8.5 pr-8 text-xs font-medium outline-none transition-all placeholder:text-muted-foreground/60 focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20 shadow-2xs"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-2.5 rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-muted-foreground shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 space-y-6 overflow-y-auto px-1 scrollbar-none">
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Prospection
          </span>
          <nav className="mt-2 space-y-1">
            {mainNavItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive =
                (item.href === "/overview" && pathname === "/overview") ||
                (item.href === "/campaigns" && (pathname === "/campaigns" || (pathname.startsWith("/campaigns/") && pathname !== "/campaigns/new"))) ||
                (item.href === "/leads" && (pathname === "/leads" || pathname.startsWith("/leads/"))) ||
                (item.href === "/outreach" && pathname.startsWith("/outreach")) ||
                (item.href === "/assistant" && pathname.startsWith("/assistant"));

              return (
                <Link
                  key={`${item.label}-${idx}`}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "size-4 transition-transform duration-200 group-hover:scale-110",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground",
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight shadow-2xs",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-orange-500/15 text-orange-600 dark:text-orange-400",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Raccourcis Rapides */}
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Actions Rapides
          </span>
          <nav className="mt-2 space-y-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <Icon className="size-3.5 text-orange-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Section Compte & Paramètres */}
        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Plateforme
          </span>
          <nav className="mt-2 space-y-1">
            {accountNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Quota & Plan Card */}
      <div className="mt-auto px-1 pt-3 space-y-3">
        <div className="rounded-2xl border border-sidebar-border bg-card/70 p-4 shadow-sm backdrop-blur-sm card-hover-lift">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-foreground">Plan Illimité 0 €</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-semibold">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Actif
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between font-mono">
            <span className="text-sm font-bold text-foreground">
              303 <span className="text-xs font-normal text-muted-foreground">leads qualifiés</span>
            </span>
          </div>
          {/* Barre de progression */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[100%] rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Google X-Ray & Dropcontact prêt</p>
        </div>

        {/* User Profile Card */}
        <div className="flex items-center justify-between rounded-2xl border border-sidebar-border bg-card/60 p-2.5 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-700 font-bold text-white text-xs shadow-sm">
              LM
            </div>
            <div className="flex flex-col truncate">
              <span className="truncate font-bold text-foreground text-xs">
                Les Frères Martins
              </span>
              <span className="truncate text-[10px] text-muted-foreground font-mono" title={userEmail || undefined}>
                {userEmail || "lesfreresmartins@gmail.com"}
              </span>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Déconnexion"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
