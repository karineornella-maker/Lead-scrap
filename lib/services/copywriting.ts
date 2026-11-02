import "server-only";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { Lead } from "@/lib/types";
import { getUnsubscribeUrl } from "./unsubscribe";

export interface GeneratedCopy {
  subject: string;
  body: string;
  fullMessage: string;
  provider: "openai" | "anthropic" | "simulation";
}

const SYSTEM_PROMPT = `Tu es un expert en prospection B2B haut de gamme pour l'investissement sur la BRVM (Bourse Régionale des Valeurs Mobilières d'Afrique de l'Ouest).
Tu rédiges des emails d'approche personnalisés, courtois, crédibles et percutants en français.

RÈGLES ABSOLUES ET ÉTHIQUES :
1. INTERDICTION FORMELLE de faire la moindre déduction ou mention relative à l'origine ethnique, la nationalité d'origine, la race ou l'appartenance communautaire (conformité RGPD art. 9).
2. Appuie-toi UNIQUEMENT sur les faits professionnels et académiques publics fournis :
   - Formation supérieure (ex: HEC Montréal, Polytechnique, etc.)
   - Liens et affiliations académiques/professionnels avec l'Afrique (ex: diplômé INP-HB, CESAG, réseau professionnel)
   - Poste actuel et secteur (ex: analyste financier, directeur de projet, etc.)
3. Longueur : entre 90 et 130 mots. Ton professionnel entre pairs du secteur financier.
4. Proposition de valeur : la dynamique de croissance de la BRVM (+25% de dividendes moyens, secteur bancaire & télécom solide), opportunité de diversification patrimoniale et d'investissement sur des marchés africains à fort potentiel.
5. Appel à l'action doux : un échange de 15 minutes ou l'envoi d'une note de synthèse d'analyse de marché.
6. Ne pas inclure de pied de page ni de signature dans ta réponse (ils sont ajoutés automatiquement par le système).

Format de réponse exigé :
SUJET: [Ligne d'objet percutante]
CORPS: [Corps du message en 90-130 mots]`;

function parseAiResponse(text: string): { subject: string; body: string } {
  let subject = "Opportunités d'investissement · Marché BRVM";
  let body = text;

  const subjectMatch = text.match(/SUJET:\s*(.+)/i);
  const bodyMatch = text.match(/CORPS:\s*([\s\S]+)/i);

  if (subjectMatch && subjectMatch[1]) {
    subject = subjectMatch[1].trim();
  }
  if (bodyMatch && bodyMatch[1]) {
    body = bodyMatch[1].trim();
  } else if (subjectMatch) {
    body = text.replace(/SUJET:\s*.+/i, "").trim();
  }

  return { subject, body };
}

export async function generateMessage(lead: Lead): Promise<GeneratedCopy> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  const unsubscribeLink = lead.business_email ? getUnsubscribeUrl(lead.business_email) : "#";
  const footer = `\n\n---\nDonnées issues de votre profil public LinkedIn · Se désinscrire : ${unsubscribeLink}`;

  const leadContext = `
Nom : ${lead.full_name}
Prénom : ${lead.first_name || ""}
Poste : ${lead.current_title || "Non renseigné"}
Entreprise : ${lead.current_company || "Non renseignée"}
Formation occidentale : ${lead.western_education || "Non renseignée"}
Liens factuels zone UEMOA / Afrique : ${lead.uemoa_ties || "Non renseignés"}
`;

  // 1. Priorité OpenAI si la clé est fournie
  if (openaiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Rédige l'email d'approche pour ce profil professionnel :\n${leadContext}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const rawText = completion.choices[0]?.message?.content || "";
      const { subject, body } = parseAiResponse(rawText);

      return {
        subject,
        body,
        fullMessage: `${body}${footer}`,
        provider: "openai",
      };
    } catch (err) {
      console.error("Erreur OpenAI, repli sur le mode standard :", err);
    }
  }

  // 2. Repli Anthropic Claude si la clé Anthropic est fournie
  if (anthropicApiKey) {
    try {
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Rédige l'email d'approche pour ce profil professionnel :\n${leadContext}`,
          },
        ],
      });

      const contentBlock = response.content[0];
      const text = contentBlock && contentBlock.type === "text" ? contentBlock.text : "";
      const { subject, body } = parseAiResponse(text);

      return {
        subject,
        body,
        fullMessage: `${body}${footer}`,
        provider: "anthropic",
      };
    } catch (err) {
      console.error("Erreur Anthropic, repli sur le mode simulation :", err);
    }
  }

  // 3. Mode simulation déterministe conforme si aucune clé n'est encore configurée
  const subject = `BRVM & marchés ouest-africains : opportunités pour votre portefeuille`;
  const greeting = lead.first_name ? `Bonjour ${lead.first_name},` : "Bonjour,";
  const eduMention = lead.western_education ? `votre parcours à ${lead.western_education}` : "votre profil";
  const tiesMention = lead.uemoa_ties ? `vos liens avec l'écosystème (${lead.uemoa_ties})` : "vos activités";

  const body = `${greeting}

J'ai remarqué ${eduMention} ainsi que ${tiesMention} dans vos activités professionnelles. Au vu de vos responsabilités en tant que ${lead.current_title || "professionnel de la finance"}, je me permets de vous contacter.

La BRVM offre aujourd'hui un rendement moyen sur dividende supérieur à 7% et une liquidité croissante sur les valeurs financières et technologiques régionales. Nous accompagnons les professionnels de la diaspora dans l'optimisation de leurs allocations d'actifs sur cette place boursière.

Seriez-vous ouvert à un court échange informel ou à la réception de notre dernière note d'opportunités d'investissement ?`;

  return {
    subject,
    body,
    fullMessage: `${body}${footer}`,
    provider: "simulation",
  };
}
