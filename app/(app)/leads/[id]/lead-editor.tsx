"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLeadMessage } from "@/app/(app)/campaigns/actions";

interface LeadEditorProps {
  leadId: string;
  initialSubject: string;
  initialMessage: string;
}

export function LeadEditor({ leadId, initialSubject, initialMessage }: LeadEditorProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState(initialMessage);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateLeadMessage(leadId, subject, message);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert(res.error || "Erreur lors de l'enregistrement");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="ai-subject">Objet du message</Label>
        <Input
          id="ai-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex : BRVM & opportunités d'allocation..."
          className="font-medium"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="ai-body">Corps du message (personnalisé IA & modifiable)</Label>
        <textarea
          id="ai-body"
          rows={9}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Rédigez ou ajustez le message personnalisé..."
          className="w-full rounded-xl border border-input bg-transparent p-3 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          {message.trim().split(/\s+/).filter(Boolean).length} mots
        </span>
        <Button onClick={handleSave} disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : saved ? (
            <Check className="size-4 text-emerald-400" />
          ) : (
            <Save className="size-4" />
          )}
          {saved ? "Enregistré !" : "Enregistrer le message"}
        </Button>
      </div>
    </div>
  );
}

