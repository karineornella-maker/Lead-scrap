"use client";

import { useTransition } from "react";
import { MailSearch, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enrichCampaign, syncEnrichment } from "../campaigns/actions";

interface LeadsEnrichButtonProps {
  campaignId?: string;
}

export function LeadsEnrichButton({ campaignId }: LeadsEnrichButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleEnrich = () => {
    startTransition(async () => {
      const res = await enrichCampaign(campaignId);
      if (!res.success) {
        alert(res.error || "Erreur lors du lancement de l'enrichissement");
      } else {
        alert(
          `${res.submittedCount} leads soumis à HarvestAPI pour la recherche d'emails pro. Cliquez sur « Synchroniser emails » dans 30 secondes pour afficher les emails trouvés !`,
        );
      }
    });
  };

  const handleSync = () => {
    startTransition(async () => {
      const res = await syncEnrichment(campaignId);
      if (!res.success) {
        alert(res.error || "Aucune mise à jour d'emails disponible.");
      } else {
        alert(`Mise à jour réussie : ${res.updatedCount} emails mis à jour dans votre tableau.`);
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleEnrich}
        className="h-9 gap-1.5 rounded-xl border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-medium"
        title="Rechercher les emails professionnels via HarvestAPI (Apify)"
      >
        <MailSearch className="size-3.5" />
        Enrichir emails
      </Button>

      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={handleSync}
        className="h-9 gap-1 rounded-xl text-xs text-muted-foreground hover:text-foreground"
        title="Synchroniser les emails enrichis"
      >
        <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
        Synchroniser emails
      </Button>
    </div>
  );
}

