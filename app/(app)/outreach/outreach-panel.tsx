"use client";

import { useState, useTransition } from "react";
import { Send, ShieldCheck, Clock, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sendOutreachBatch } from "./actions";

interface OutreachPanelProps {
  totalVerifiedLeads: number;
  totalSentLeads: number;
  campaigns: { id: string; name: string }[];
}

export function OutreachPanel({
  totalVerifiedLeads,
  totalSentLeads,
  campaigns,
}: OutreachPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [batchSize, setBatchSize] = useState<number>(15);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    sentCount: number;
    errors: string[];
  } | null>(null);

  const remainingToSend = Math.max(0, totalVerifiedLeads - totalSentLeads);

  const handleSend = () => {
    if (
      !confirm(
        `Confirmez-vous le lancement d'un lot sécurisé de ${batchSize} email(s) ?\nChaque email sera envoyé avec un délai anti-spam et une personnalisation IA.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await sendOutreachBatch({
          campaignId: selectedCampaign || undefined,
          batchSize,
          delaySecondsBetweenSends: 2,
        });
        setResult(res);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setResult({
          success: false,
          message: `Erreur: ${msg}`,
          sentCount: 0,
          errors: [msg],
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistiques d'envoi & Anti-spam metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Emails Éligibles</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{totalVerifiedLeads}</p>
          <p className="mt-1 text-xs text-muted-foreground">Adresses pro vérifiées ou qualifiées</p>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Emails Envoyés</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{totalSentLeads}</p>
          <p className="mt-1 text-xs text-muted-foreground">Avec traçabilité anti-doublon</p>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Restants à contacter</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{remainingToSend}</p>
          <p className="mt-1 text-xs text-muted-foreground">Prêts pour le prochain lot</p>
        </Card>
      </div>

      {/* Configuration du Lot Anti-Spam */}
      <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <Sparkles className="size-5 text-primary" />
          <h2 className="font-semibold text-foreground text-base">
            Générateur & Expéditeur par Lot Raisonnable (0 €)
          </h2>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {/* Sélection de la campagne */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Campagne cible</label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs outline-none focus:border-ring"
            >
              <option value="">Toutes les campagnes</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Taille du lot */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              Taille du lot (Recommandé anti-spam : 10 à 25 par jour)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 25, 50].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setBatchSize(size)}
                  className={`h-10 rounded-xl text-xs font-medium border transition-colors ${
                    batchSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  {size} mails
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Règles de sécurité affichées */}
        <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-500" />
            Mesures de protection anti-spam actives :
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>0 Risque de doublon :</strong> Un lead déjà contacté n'est jamais relancé par erreur dans un nouveau lot.
            </li>
            <li>
              <strong>Temporisation naturelle :</strong> Envoi étalé dans le temps pour simuler un comportement humain.
            </li>
            <li>
              <strong>Lien de désinscription RGPD :</strong> Inclus systématiquement au bas de chaque message.
            </li>
            <li>
              <strong>100% Gratuit :</strong> Fonctionne en direct ou prêt pour l'import Waalaxy.
            </li>
          </ul>
        </div>

        {/* Bouton d'action */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Taille sélectionnée : <span className="font-semibold text-foreground">{batchSize} contacts</span>
          </p>

          <Button
            onClick={handleSend}
            disabled={isPending || remainingToSend === 0}
            className="h-10 gap-2 rounded-xl bg-primary px-5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            <Send className="size-4" />
            {isPending ? "Envoi du lot en cours..." : `Envoyer le lot de ${batchSize} emails`}
          </Button>
        </div>

        {/* Affichage des retours */}
        {result && (
          <div
            className={`mt-6 rounded-xl border p-4 text-xs ${
              result.success
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {result.success ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
              {result.message}
            </div>
            {result.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 space-y-0.5 opacity-90">
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

