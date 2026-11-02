import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { generateAssistantReplies } from "./martins-assistant";
import { sendEmail, getSmtpConfig } from "@/lib/services/outreach/sender";
import { getUnsubscribeUrl } from "@/lib/services/unsubscribe";
import { createAdminClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";

export interface AutoReplyRunResult {
  checkedCount: number;
  repliedCount: number;
  skippedCount: number;
  logs: string[];
}

/**
 * Scrute la boîte email (Gmail / IMAP) des Frères Martins,
 * détecte les réponses des prospects de la base, génère la réponse
 * dans leur style (sans appel, webinar/vidéo/échange) et y répond automatiquement.
 */
export async function checkAndAutoReplyInbox(): Promise<AutoReplyRunResult> {
  const host = process.env.IMAP_HOST || "imap.gmail.com";
  const port = parseInt(process.env.IMAP_PORT || "993", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const logs: string[] = [];

  if (!user || !pass) {
    logs.push("IMAP/SMTP non configuré dans .env.local (SMTP_USER ou SMTP_PASS manquant).");
    return {
      checkedCount: 0,
      repliedCount: 0,
      skippedCount: 0,
      logs,
    };
  }

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  const supabase = createAdminClient();
  let checkedCount = 0;
  let repliedCount = 0;
  let skippedCount = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Récupérer les messages récents (15 derniers messages reçus)
      const messages = client.fetch("1:15", { envelope: true, source: true });

      for await (const msg of messages) {
        checkedCount++;
        if (!msg.source) continue;
        const parsed = await simpleParser(msg.source);
        const fromEmail = parsed.from?.value[0]?.address?.toLowerCase().trim();
        const incomingText = parsed.text || (typeof parsed.html === "string" ? parsed.html.replace(/<[^>]+>/g, "") : "");
        const originalSubject = parsed.subject || "Re: Notre échange BRVM";
        const messageId = msg.envelope?.messageId || "";

        if (!fromEmail) {
          skippedCount++;
          continue;
        }

        // Vérifier si cet expéditeur correspond à un de nos leads qualifiés
        const { data: leadData } = await supabase
          .from("leads")
          .select("*")
          .or(`business_email.ilike.${fromEmail},email.ilike.${fromEmail}`)
          .maybeSingle();

        const lead = leadData as Lead | null;

        if (!lead) {
          logs.push(`Email ignoré (expéditeur non répertorié dans les leads) : ${fromEmail}`);
          skippedCount++;
          continue;
        }

        // Vérifier si on lui a déjà répondu automatiquement à ce même message pour éviter une boucle
        const existingRaw = (lead.raw as Record<string, unknown>) || {};
        const autoReplies = (existingRaw.auto_replies as Array<Record<string, unknown>>) || [];

        const alreadyHandled = autoReplies.some(
          (r) => (messageId && r.message_id === messageId) || r.from_subject === originalSubject,
        );

        if (alreadyHandled) {
          logs.push(`Message déjà traité pour ${lead.full_name} (${fromEmail})`);
          skippedCount++;
          continue;
        }

        // Génération automatique de la réponse (Style Frères Martins : Webinar ou Vidéo, AUCUN appel)
        const suggestions = await generateAssistantReplies({
          incomingMessage: incomingText,
          lead,
        });

        // On sélectionne la meilleure réponse : priorité Webinar ou Vidéo pédagogique
        const chosenReply =
          suggestions.find((s) => s.angle === "webinar_invitation") ||
          suggestions.find((s) => s.angle === "pedagogic_video") ||
          suggestions[0];

        if (!chosenReply) {
          logs.push(`Impossible de formuler une réponse pour ${fromEmail}`);
          skippedCount++;
          continue;
        }

        const replySubject = originalSubject.startsWith("Re:") ? originalSubject : `Re: ${originalSubject}`;
        const unsubUrl = getUnsubscribeUrl(fromEmail);

        const htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="font-size: 15px; white-space: pre-line; margin-bottom: 30px;">
              ${chosenReply.body}
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
            <div style="font-size: 11px; color: #94a3b8; text-align: center;">
              Les Frères Martins · Passion & Investissement en Afrique de l'Ouest
              <br />
              <a href="${unsubUrl}" style="color: #64748b; text-decoration: underline;">Se désinscrire</a>
            </div>
          </div>
        `;

        // Envoi automatique de la réponse
        const sendRes = await sendEmail({
          to: fromEmail,
          subject: replySubject,
          html: htmlContent,
          text: chosenReply.body,
        });

        if (sendRes.success) {
          repliedCount++;
          logs.push(`Réponse automatique envoyée à ${lead.full_name} (${fromEmail}) : "${chosenReply.title}"`);

          // Sauvegarde de l'historique dans la base de données
          autoReplies.push({
            sent_at: new Date().toISOString(),
            message_id: messageId,
            from_subject: originalSubject,
            reply_subject: replySubject,
            reply_body: chosenReply.body,
          });

          await supabase
            .from("leads")
            .update({
              raw: {
                ...existingRaw,
                auto_replies: autoReplies,
              },
            })
            .eq("id", lead.id);
        } else {
          logs.push(`Erreur lors de l'envoi à ${fromEmail} : ${sendRes.error}`);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logs.push(`Erreur IMAP : ${errorMsg}`);
  }

  return {
    checkedCount,
    repliedCount,
    skippedCount,
    logs,
  };
}
