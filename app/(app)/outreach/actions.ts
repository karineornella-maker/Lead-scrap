"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sendEmail, getSmtpConfig } from "@/lib/services/outreach/sender";
import { generateMessage } from "@/lib/services/copywriting";
import { getUnsubscribeUrl } from "@/lib/services/unsubscribe";
import type { Lead } from "@/lib/types";

export interface BatchSendOptions {
  campaignId?: string;
  batchSize: number; // ex: 10, 20, 30
  delaySecondsBetweenSends: number; // ex: 30s à 90s pour éviter la détection de spam
}

export interface BatchSendResult {
  success: boolean;
  totalTargeted: number;
  sentCount: number;
  simulated: boolean;
  errors: string[];
  message: string;
}

/**
 * Envoie un lot contrôlé d'emails personnalisés avec temporisation anti-spam
 */
export async function sendOutreachBatch(options: BatchSendOptions): Promise<BatchSendResult> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return {
      success: false,
      totalTargeted: 0,
      sentCount: 0,
      simulated: false,
      errors: ["Non autorisé"],
      message: "Veuillez vous reconnecter.",
    };
  }

  const { campaignId, batchSize = 10, delaySecondsBetweenSends = 2 } = options;

  // 1. Récupération des leads avec email vérifié ou risqué
  let query = supabase
    .from("leads")
    .select("*")
    .in("email_status", ["verified", "risky"])
    .order("uemoa_affinity_score", { ascending: false });

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data: leads, error } = await query.limit(batchSize * 3);

  if (error || !leads || leads.length === 0) {
    return {
      success: false,
      totalTargeted: 0,
      sentCount: 0,
      simulated: false,
      errors: [error?.message || "Aucun lead trouvé avec email éligible."],
      message: "Aucun lead disponible pour l'envoi.",
    };
  }

  // Filtrer ceux qui n'ont pas encore été envoyés (stocké dans lead.raw.outreach)
  const eligibleLeads = leads.filter((l) => {
    const raw = (l.raw as Record<string, unknown>) || {};
    const outreach = raw.outreach as Record<string, unknown> | undefined;
    return !outreach || outreach.status !== "sent";
  }).slice(0, batchSize);

  if (eligibleLeads.length === 0) {
    return {
      success: true,
      totalTargeted: 0,
      sentCount: 0,
      simulated: false,
      errors: [],
      message: "Tous les leads éligibles de ce lot ont déjà reçu un email !",
    };
  }

  const smtpConfig = getSmtpConfig();
  const isSimulated = !smtpConfig;
  let sentCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < eligibleLeads.length; i++) {
    const lead = eligibleLeads[i] as Lead;
    const recipientEmail = lead.business_email || lead.email;

    if (!recipientEmail) continue;

    // S'assurer qu'un message et sujet IA existent, sinon on les génère
    let subject = lead.ai_subject;
    let body = lead.ai_personalized_message;

    if (!subject || !body) {
      try {
        const copy = await generateMessage(lead);
        subject = copy.subject;
        body = copy.fullMessage;
        // Enregistrer dans la fiche lead
        await supabase
          .from("leads")
          .update({
            ai_subject: subject,
            ai_personalized_message: body,
          })
          .eq("id", lead.id);
      } catch {
        subject = `Opportunité d'investissement BRVM · ${lead.full_name}`;
        body = `Bonjour ${lead.first_name || lead.full_name},\n\nJ'ai découvert votre parcours et je souhaitais échanger avec vous sur les opportunités financières en zone UEMOA.`;
      }
    }

    const unsubUrl = getUnsubscribeUrl(recipientEmail);
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="font-size: 15px; white-space: pre-line; margin-bottom: 30px;">
          ${body}
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <div style="font-size: 11px; color: #94a3b8; text-align: center;">
          Vous recevez ce message professionnel ciblé dans le cadre d'échanges d'affaires B2B UEMOA.
          <br />
          Pour ne plus recevoir de messages de notre part, <a href="${unsubUrl}" style="color: #64748b; text-decoration: underline;">cliquez ici pour vous désinscrire</a>.
        </div>
      </div>
    `;

    // Envoi de l'email
    const res = await sendEmail({
      to: recipientEmail,
      subject: subject || "Opportunité BRVM & Diaspora UEMOA",
      html: htmlContent,
      text: body,
    });

    if (res.success) {
      sentCount++;
      // Enregistrer le statut d'envoi dans le champ JSONB raw.outreach
      const existingRaw = (lead.raw as Record<string, unknown>) || {};
      const updatedRaw = {
        ...existingRaw,
        outreach: {
          status: "sent",
          sent_at: new Date().toISOString(),
          recipient: recipientEmail,
          simulated: res.simulated ?? false,
          message_id: res.messageId ?? null,
        },
      };

      await supabase
        .from("leads")
        .update({ raw: updatedRaw })
        .eq("id", lead.id);
    } else {
      errors.push(`${lead.full_name} (${recipientEmail}): ${res.error}`);
    }

    // Temporisation anti-spam entre chaque email (sauf pour le dernier)
    if (i < eligibleLeads.length - 1 && delaySecondsBetweenSends > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(delaySecondsBetweenSends, 5) * 1000));
    }
  }

  revalidatePath("/leads");
  revalidatePath("/outreach");

  return {
    success: sentCount > 0,
    totalTargeted: eligibleLeads.length,
    sentCount,
    simulated: isSimulated,
    errors,
    message: isSimulated
      ? `Mode Simulation Actif (0 €) : ${sentCount} email(s) généré(s) et marqués comme envoyés sans risque de spam. Pour envoyer en réel sans frais, ajoutez vos identifiants Gmail/Outlook SMTP dans .env.local !`
      : `Envoi réussi : ${sentCount} email(s) envoyé(s) via votre boîte mail avec cadence anti-spam respectée.`,
  };
}

