"use server";

import { requireUser } from "@/lib/auth";
import { generateAssistantReplies, type ReplySuggestion } from "@/lib/services/assistant/martins-assistant";
import { sendEmail } from "@/lib/services/outreach/sender";
import { getUnsubscribeUrl } from "@/lib/services/unsubscribe";
import type { Lead } from "@/lib/types";

export async function askAssistantToReply({
  incomingMessage,
  leadId,
  customInstruction,
}: {
  incomingMessage: string;
  leadId?: string;
  customInstruction?: string;
}): Promise<{ success: boolean; suggestions: ReplySuggestion[]; error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, suggestions: [], error: "Non autorisé" };
  }

  let lead: Partial<Lead> | null = null;
  if (leadId) {
    const { data } = await supabase.from("leads").select("*").eq("id", leadId).single();
    lead = data as Partial<Lead> | null;
  }

  try {
    const suggestions = await generateAssistantReplies({
      incomingMessage,
      lead,
      customInstruction,
    });
    return { success: true, suggestions };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, suggestions: [], error: msg };
  }
}

export async function triggerAutoReplyScan() {
  const { user } = await requireUser();
  if (!user) return { success: false, error: "Non autorisé" };

  const { checkAndAutoReplyInbox } = await import("@/lib/services/assistant/auto-responder");
  try {
    const res = await checkAndAutoReplyInbox();
    return { success: true, result: res };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function sendAssistantReply({
  recipientEmail,
  subject,
  body,
  leadId,
}: {
  recipientEmail: string;
  subject: string;
  body: string;
  leadId?: string;
}): Promise<{ success: boolean; message: string }> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, message: "Non autorisé" };
  }

  const unsubUrl = getUnsubscribeUrl(recipientEmail);
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="font-size: 15px; white-space: pre-line; margin-bottom: 30px;">
        ${body}
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
      <div style="font-size: 11px; color: #94a3b8; text-align: center;">
        Les Frères Martins · Passion & Investissement en Afrique de l'Ouest
        <br />
        <a href="${unsubUrl}" style="color: #64748b; text-decoration: underline;">Se désinscrire</a>
      </div>
    </div>
  `;

  const res = await sendEmail({
    to: recipientEmail,
    subject,
    html: htmlContent,
    text: body,
  });

  if (res.success && leadId) {
    // Archiver la réponse dans le lead
    const { data: leadData } = await supabase.from("leads").select("raw").eq("id", leadId).single();
    const existingRaw = (leadData?.raw as Record<string, unknown>) || {};
    const repliesHistory = ((existingRaw.replies as Array<unknown>) || []);
    repliesHistory.push({
      sent_at: new Date().toISOString(),
      subject,
      body,
    });

    await supabase
      .from("leads")
      .update({
        raw: {
          ...existingRaw,
          replies: repliesHistory,
        },
      })
      .eq("id", leadId);
  }

  return {
    success: res.success,
    message: res.simulated
      ? "Mode simulation (0 €) : Réponse validée avec succès !"
      : res.success
        ? "Réponse envoyée avec succès !"
        : `Erreur d'envoi: ${res.error}`,
  };
}

