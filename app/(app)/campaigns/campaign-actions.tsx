"use client";

import { useTransition } from "react";
import { Play, RefreshCw, Sparkles, MailSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  launchCampaign,
  syncCampaign,
  enrichCampaign,
  syncEnrichment,
  generateMessages,
} from "./actions";
import type { CampaignStatus } from "@/lib/types";

interface CampaignActionButtonsProps {
  campaignId: string;
  status: CampaignStatus;
  hasApifyRun: boolean;
}

export function CampaignActionButtons({
  campaignId,
  status,
  hasApifyRun,
}: CampaignActionButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleLaunch = () => {
    startTransition(async () => {
      const res = await launchCampaign(campaignId);
      if (!res.success) {
        alert(res.error || "Erreur lors du lancement");
      }
    });
  };

  const handleSync = () => {
    startTransition(async () => {
      const res = await syncCampaign(campaignId);
      if (!res.success) {
        alert(res.error || "Erreur lors de la synchronisation");
      } else if (res.summary) {
        alert(
          `Synchronisation terminée : ${res.summary.qualified} leads qualifiés importés (sur ${res.summary.parsed} analysés).`,
        );
      }
    });
  };

  const handleEnrich = () => {
    startTransition(async () => {
      const res = await enrichCampaign(campaignId);
      if (!res.success) {
        alert(res.error || "Erreur lors de l'enrichissement");
      } else {
        alert(`${res.submittedCount} leads soumis à l'enrichissement.`);
      }
    });
  };

  const handleSyncEnrich = () => {
    startTransition(async () => {
      const res = await syncEnrichment(campaignId);
      if (!res.success) {
        alert(res.error || "Aucune mise à jour disponible");
      } else {
        alert(`${res.updatedCount} emails mis à jour.`);
      }
    });
  };

  const handleGenerate = () => {
    startTransition(async () => {
      const res = await generateMessages(campaignId);
      if (!res.success) {
        alert(res.error || "Erreur lors de la génération IA");
      } else {
        alert(`${res.generatedCount} messages personnalisés générés.`);
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {status === "draft" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={handleLaunch}
          className="h-8 gap-1 rounded-lg text-xs"
        >
          <Play className="size-3 text-emerald-600 fill-emerald-600" />
          Lancer
        </Button>
      )}

      {status === "running" && (
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={handleSync}
          className="h-8 gap-1 rounded-lg text-xs"
        >
          <RefreshCw className={`size-3 ${isPending ? "animate-spin" : ""}`} />
          Synchroniser
        </Button>
      )}

      {hasApifyRun && (
        <>
          <Button
            size="sm"
            variant="ghost"
            title="Enrichir les emails (HarvestAPI / Dropcontact)"
            disabled={isPending}
            onClick={handleEnrich}
            className="h-8 gap-1 rounded-lg text-xs hover:bg-muted"
          >
            <MailSearch className="size-3.5 text-blue-500" />
            Enrichir
          </Button>

          <Button
            size="sm"
            variant="ghost"
            title="Récupérer le statut des emails"
            disabled={isPending}
            onClick={handleSyncEnrich}
            className="h-8 p-1.5 rounded-lg text-xs"
          >
            <RefreshCw className={`size-3 text-muted-foreground ${isPending ? "animate-spin" : ""}`} />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            title="Générer les accroches IA"
            disabled={isPending}
            onClick={handleGenerate}
            className="h-8 gap-1 rounded-lg text-xs hover:bg-muted"
          >
            <Sparkles className="size-3.5 text-amber-500" />
            IA
          </Button>
        </>
      )}
    </div>
  );
}

