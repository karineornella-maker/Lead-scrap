"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Bot,
  User,
  MessageSquare,
  HelpCircle,
  Video,
  PhoneCall,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { askAssistantToReply, sendAssistantReply, triggerAutoReplyScan } from "./actions";
import type { ReplySuggestion } from "@/lib/services/assistant/martins-assistant";

interface AssistantClientProps {
  leads: {
    id: string;
    full_name: string;
    first_name: string | null;
    current_company: string | null;
    current_title: string | null;
    business_email: string | null;
    email: string | null;
  }[];
}

export function AssistantClient({ leads }: AssistantClientProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [incomingMessage, setIncomingMessage] = useState<string>("");
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [suggestions, setSuggestions] = useState<ReplySuggestion[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<ReplySuggestion | null>(null);
  const [editedBody, setEditedBody] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const [isGenerating, startGeneration] = useTransition();
  const [isSending, startSending] = useTransition();
  const [isScanning, startScanning] = useTransition();
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    repliedCount?: number;
    checkedCount?: number;
    logs?: string[];
    error?: string;
  } | null>(null);

  const handleScanInbox = () => {
    startScanning(async () => {
      const res = await triggerAutoReplyScan();
      if (res.success && res.result) {
        setScanResult({
          success: true,
          repliedCount: res.result.repliedCount,
          checkedCount: res.result.checkedCount,
          logs: res.result.logs,
        });
      } else {
        setScanResult({
          success: false,
          error: res.error || "Échec de la relève de la boîte.",
        });
      }
    });
  };

  const currentLead = leads.find((l) => l.id === selectedLeadId);
  const currentEmail = currentLead?.business_email || currentLead?.email || "";

  const handleGenerate = () => {
    if (!incomingMessage.trim()) {
      alert("Veuillez coller le message reçu du prospect.");
      return;
    }

    startGeneration(async () => {
      const res = await askAssistantToReply({
        incomingMessage,
        leadId: selectedLeadId || undefined,
        customInstruction: customInstruction || undefined,
      });

      if (res.success && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
        setActiveSuggestion(res.suggestions[0]);
        setEditedBody(res.suggestions[0].body);
        setSendResult(null);
      } else {
        alert(res.error || "Impossible de générer des réponses.");
      }
    });
  };

  const handleSelectSuggestion = (s: ReplySuggestion) => {
    setActiveSuggestion(s);
    setEditedBody(s.body);
    setSendResult(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (!currentEmail) {
      alert("Ce prospect n'a pas d'adresse email enregistrée pour l'envoi direct.");
      return;
    }

    startSending(async () => {
      const res = await sendAssistantReply({
        recipientEmail: currentEmail,
        subject: activeSuggestion?.subject || "Re: Notre échange BRVM",
        body: editedBody,
        leadId: selectedLeadId || undefined,
      });

      setSendResult(res.message);
    });
  };

  return (
    <div className="space-y-6">
      {/* Barre de pilotage 100% Autonome */}
      <Card className="rounded-2xl border-border bg-gradient-to-r from-primary/10 via-card to-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-semibold text-foreground text-sm">Mode Réponse 100% Automatique (Sans intervention)</h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              L'IA scrute votre boîte mail, analyse les réponses de vos prospects, génère une réponse personnalisée dans le style des Frères Martins (webinar du 8 nov ou vidéo, sans appel) et l'envoie automatiquement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleScanInbox}
              disabled={isScanning}
              className="h-10 gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <Bot className="size-4" />
              {isScanning ? "Analyse & Réponses en cours..." : "Scanner la boîte & Répondre automatiquement"}
            </Button>
          </div>
        </div>

        {scanResult && (
          <div
            className={`mt-4 rounded-xl border p-3 text-xs ${
              scanResult.success
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {scanResult.success ? (
              <div className="space-y-1">
                <p className="font-semibold">
                  Scan terminé : {scanResult.checkedCount} emails vérifiés · {scanResult.repliedCount} réponse(s) automatique(s) envoyée(s) !
                </p>
                {scanResult.logs && scanResult.logs.length > 0 && (
                  <ul className="list-disc pl-4 text-[11px] opacity-80 space-y-0.5">
                    {scanResult.logs.map((log, idx) => (
                      <li key={idx}>{log}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="font-medium">{scanResult.error}</p>
            )}
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
      {/* Panneau gauche : Saisie du message reçu et contexte */}
      <div className="space-y-5 lg:col-span-5">
        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Contexte du prospect</h3>
              <p className="text-xs text-muted-foreground">Associez un lead pour personnaliser au maximum</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Sélectionner un lead (optionnel)</label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs outline-none focus:border-ring"
            >
              <option value="">Aucun lead (réponse générique Frères Martins)</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.full_name} {l.current_company ? `(${l.current_company})` : ""}
                </option>
              ))}
            </select>
          </div>

          {currentLead && (
            <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1 text-muted-foreground border border-border/50">
              <p>
                <strong>Nom :</strong> {currentLead.full_name}
              </p>
              {currentLead.current_title && (
                <p>
                  <strong>Poste :</strong> {currentLead.current_title}
                </p>
              )}
              {currentLead.current_company && (
                <p>
                  <strong>Entreprise :</strong> {currentLead.current_company}
                </p>
              )}
              {currentEmail && (
                <p>
                  <strong>Email :</strong> <span className="text-primary font-medium">{currentEmail}</span>
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-foreground flex items-center justify-between">
              <span>Message reçu du prospect</span>
              <span className="text-[10px] text-muted-foreground font-normal">Collez son email ou message LinkedIn</span>
            </label>
            <textarea
              rows={5}
              value={incomingMessage}
              onChange={(e) => setIncomingMessage(e.target.value)}
              placeholder="Exemple : 'Bonjour, merci pour votre message ! Je m'intéresse de près aux actions en zone UEMOA mais je ne sais pas par où commencer. Avez-vous des ressources ?'"
              className="w-full rounded-xl border border-input bg-card p-3 text-xs outline-none focus:border-ring resize-none leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center justify-between">
              <span>Instruction spéciale (optionnel)</span>
              <span className="text-[10px] text-muted-foreground font-normal">Ex: insister sur le webinar, être très bref...</span>
            </label>
            <input
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Ex: Proposer directement le webinar du 8 novembre"
              className="h-9 w-full rounded-xl border border-input bg-card px-3 text-xs outline-none focus:border-ring"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !incomingMessage.trim()}
            className="w-full h-10 gap-2 rounded-xl bg-primary text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 mt-2"
          >
            <Sparkles className="size-4" />
            {isGenerating ? "L'assistante rédige vos options..." : "Générer les réponses (Style Frères Martins)"}
          </Button>
        </Card>

        {/* Rappel du style fraternel */}
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Bot className="size-4 text-primary" />
            Directives de style actives :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Vouvoiement chaleureux et naturel (zéro agressivité).</li>
            <li>Objectif : créer du lien, inviter au webinar du 8 nov, ou proposer 15 min d'échange.</li>
            <li>Concision : 3 à 5 lignes max.</li>
          </ul>
        </div>
      </div>

      {/* Panneau droit : Suggestions générées et zone d'envoi */}
      <div className="space-y-5 lg:col-span-7">
        {suggestions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-dashed border-2 border-border bg-card/50 min-h-[420px]">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-sm">
              <Bot className="size-7" />
            </div>
            <h3 className="font-semibold text-foreground text-base">Votre assistante virtuelle est prête</h3>
            <p className="text-xs text-muted-foreground max-w-md mt-1 leading-relaxed">
              Collez un message reçu à gauche. L'IA rédigera instantanément 3 options de réponses respectant rigoureusement votre style d'échange, vos invitations webinar et vos propositions d'appels de 15 min.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Onglets de choix des 3 angles */}
            <div className="grid grid-cols-3 gap-2">
              {suggestions.map((s, idx) => {
                const isSelected = activeSuggestion?.angle === s.angle;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border bg-card hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {s.angle === "webinar_invitation" && <Video className="size-3.5" />}
                      {s.angle === "pedagogic_video" && <Video className="size-3.5" />}
                      {s.angle === "open_conversation" && <MessageSquare className="size-3.5" />}
                      <span className="truncate">{s.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{s.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Éditeur de la réponse sélectionnée */}
            <Card className="rounded-2xl border-border bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Réponse personnalisée · {activeSuggestion?.title}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 gap-1.5 rounded-lg text-xs font-medium"
                >
                  {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  {copied ? "Copié !" : "Copier le texte"}
                </Button>
              </div>

              <textarea
                rows={8}
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs leading-relaxed outline-none focus:border-ring resize-none font-sans"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-muted-foreground">
                  Destinataire :{" "}
                  {currentEmail ? (
                    <strong className="text-foreground">{currentEmail}</strong>
                  ) : (
                    <span className="italic text-amber-500">Sélectionnez un lead pour l'envoi direct</span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSend}
                    disabled={isSending || !currentEmail || !editedBody.trim()}
                    className="h-9 gap-2 rounded-xl bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
                  >
                    <Send className="size-3.5" />
                    {isSending ? "Envoi en cours..." : "Envoyer cette réponse"}
                  </Button>
                </div>
              </div>

              {sendResult && (
                <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                  {sendResult}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

