import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignStatus, EmailStatus } from "@/lib/types";

const campaignStatus: Record<CampaignStatus, { label: string; className: string; dotClass: string }> = {
  draft: {
    label: "Brouillon",
    className: "bg-muted text-muted-foreground border-border/60",
    dotClass: "bg-muted-foreground",
  },
  running: {
    label: "En cours",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    dotClass: "bg-blue-500 animate-pulse",
  },
  completed: {
    label: "Terminée",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
};

export const emailStatusLabels: Record<EmailStatus, string> = {
  verified: "Vérifié",
  risky: "Risqué",
  not_found: "Introuvable",
  pending: "En attente",
};

const emailStatusConfig: Record<EmailStatus, { className: string; dotClass: string }> = {
  verified: {
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 font-semibold",
    dotClass: "bg-emerald-500",
  },
  risky: {
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25 font-semibold",
    dotClass: "bg-amber-500",
  },
  not_found: {
    className: "bg-destructive/10 text-destructive border-destructive/20 font-medium",
    dotClass: "bg-destructive",
  },
  pending: {
    className: "bg-muted text-muted-foreground border-border/50",
    dotClass: "bg-muted-foreground/50",
  },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const conf = campaignStatus[status];
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-0.5 text-[11px] gap-1.5 shadow-2xs font-semibold", conf.className)}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", conf.dotClass)} />
      {conf.label}
    </Badge>
  );
}

export function EmailStatusBadge({ status }: { status: EmailStatus }) {
  const conf = emailStatusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-0.5 text-[11px] gap-1.5 shadow-2xs", conf.className)}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", conf.dotClass)} />
      {emailStatusLabels[status]}
    </Badge>
  );
}

export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-xs font-mono">—</span>;
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold tabular-nums shadow-2xs gap-1",
        score >= 70
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
          : score >= 40
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25"
            : "bg-muted text-muted-foreground border-border/50",
      )}
    >
      <span>{score}</span>
      <span className="text-[9px] opacity-70">/100</span>
    </Badge>
  );
}
