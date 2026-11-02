import OpenAI from "openai";
import type { Lead } from "@/lib/types";

export interface AssistantPersona {
  senderName: string;
  tone: string;
  coreObjective: string;
  defaultWebinarDate?: string;
  popularVideoUrl?: string;
  webinarLink?: string;
  calendarLink?: string;
}

export const defaultPersona: AssistantPersona = {
  senderName: "Les Frères Martins",
  tone: "Chaleureux, naturel et professionnel, avec vouvoiement respectueux. Écrire comme deux frères passionnés qui souhaitent faire connaissance et échanger avec des professionnels intéressés par l'Afrique de l'Ouest et la zone UEMOA. Jamais pushy ou agressif commercialement. Tout se passe par message et ressources à forte valeur.",
  coreObjective:
    "Créer un échange fluide et authentique par message. Comprendre l'intérêt du prospect pour la BRVM (bourse régionale d'Afrique de l'Ouest). Proposer avec finesse d'assister au prochain webinar, ou partager une vidéo / document pédagogique de grande valeur. IMPORTANT : Aucun appel téléphonique ou visio (pas de temps pour les appels) — tout se traite directement par message et contenu.",
  defaultWebinarDate: "8 novembre",
  popularVideoUrl: "https://youtu.be/ex-brvm-martins",
  webinarLink: "https://leadora.ai/webinar-brvm",
};

export interface ReplySuggestion {
  angle: "webinar_invitation" | "pedagogic_video" | "pedagogic_doc" | "open_conversation";
  title: string;
  description: string;
  subject?: string;
  body: string;
}

export interface GenerateRepliesParams {
  lead?: Partial<Lead> | null;
  incomingMessage: string;
  persona?: Partial<AssistantPersona>;
  customInstruction?: string;
}

const SYSTEM_PROMPT = `
Tu es l'assistante virtuelle de rédaction des Frères Martins (investisseurs et créateurs de contenus spécialisés sur la Bourse Régionale des Valeurs Mobilières - BRVM et les opportunités financières en Afrique de l'Ouest / zone UEMOA).

TON IDENTITÉ & STYLE D'ÉCRITURE :
- Tu t'exprimes au nom des "Frères Martins".
- Ton : Chaleureux, fraternel, humble, naturel et professionnel.
- Règle d'or du vouvoiement : Toujours utiliser le "Vous", mais avec bienveillance et proximité (jamais distant ou pompeux).
- Zéro vente agressive, zéro pression : Tu ne cherches pas à "closer" un deal. Tu cherches à connecter, apprendre à connaître la personne, et partager de la valeur.
- Concision : Messages courts (3 à 6 lignes maximum), aérés, faciles à lire sur un smartphone.

RÈGLE MAJEURE SUR LES APPELS :
- NE JAMAIS PROPOSER D'APPEL, DE VISIO OU DE RÉUNION (pas de Google Meet, pas de Zoom, pas de téléphone, pas de Calendly).
- Les fondateurs n'ont pas le temps pour des appels individuels.
- Tous les échanges se font 100% par message asynchrone, ou en orientant vers :
  1. Le prochain Webinar gratuit (ex: 8 novembre).
  2. La vidéo pédagogique la plus populaire.
  3. Un document ou guide d'analyse BRVM en PDF.

EXEMPLES DE RÉFÉRENCE DE TON STYLE (Clone exact) :
Exemple 1 : "Merci pour la connexion, le plaisir est partagé ! Dites-moi, quel regard portez-vous sur la BRVM ? Vous y investissez déjà ou envisagez-vous d’y investir ?"
Exemple 2 : "Merci pour votre retour, Sévérin ! C’est super que vous investissiez déjà à la BRVM. Pour vous donner un aperçu de nos contenus, voici notre vidéo la plus populaire sur le sujet : [lien]. Nous organisons un webinar sur la BRVM le 8 novembre. Seriez-vous intéressé pour y participer ? Si oui, je vous enverrai le lien d’inscription."

DIRECTIVES POUR CHAQUE RÉPONSE :
Génère 3 suggestions distinctes de réponse adaptées au message reçu du prospect (SANS AUCUN APPEL) :
1. "Invitation Webinar" : Remercie le prospect, rebondit sur son retour, et propose le webinar du 8 novembre pour approfondir ensemble.
2. "Partage de Vidéo / Guide pédagogique" : Partage la vidéo la plus populaire ou un guide documenté pour lui apporter de la valeur immédiate par écrit.
3. "Question ouverte & Échange par message" : Approche douce et curieuse pour comprendre sa vision de la zone UEMOA et continuer d'échanger naturellement par message.
`;

export async function generateAssistantReplies(
  params: GenerateRepliesParams,
): Promise<ReplySuggestion[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const lead = params.lead;
  const leadName = lead?.first_name || lead?.full_name?.split(" ")[0] || "cher contact";
  const leadCompany = lead?.current_company ? ` chez ${lead.current_company}` : "";
  const leadTitle = lead?.current_title ? ` (${lead.current_title})` : "";
  const leadContext = `Prospect : ${leadName}${leadTitle}${leadCompany}.\nLien UEMOA : ${lead?.uemoa_ties || "Non spécifié"}.\nFormation : ${lead?.western_education || "Non spécifiée"}.`;

  const userPrompt = `
Message reçu du prospect :
"""
${params.incomingMessage}
"""

Contexte du prospect :
${leadContext}

${params.customInstruction ? `Instruction spécifique de l'utilisateur : ${params.customInstruction}\n` : ""}

Génère un objet JSON strictement valide au format suivant :
{
  "suggestions": [
    {
      "angle": "webinar_invitation",
      "title": "Invitation Webinar & Pédagogie",
      "description": "Propose le webinar du 8 novembre pour approfondir sans appel",
      "subject": "Re: Notre échange BRVM",
      "body": "Texte exact du message prêt à être envoyé..."
    },
    {
      "angle": "pedagogic_video",
      "title": "Partage de Vidéo / Guide pédagogique",
      "description": "Apporte de la valeur immédiate avec votre vidéo la plus populaire ou un guide",
      "subject": "Re: Notre échange BRVM",
      "body": "Texte exact du message..."
    },
    {
      "angle": "open_conversation",
      "title": "Question ouverte & Découverte",
      "description": "Pour relancer la discussion par message sans aucune pression",
      "subject": "Re: Notre échange BRVM",
      "body": "Texte exact du message..."
    }
  ]
}
`;

  if (!apiKey || apiKey.startsWith("default-")) {
    // Mode simulation réaliste sans surcoût
    return [
      {
        angle: "webinar_invitation",
        title: "Invitation Webinar & Pédagogie",
        description: "Rebondit sur son message et propose de participer au prochain webinar",
        subject: "Re: Échange BRVM",
        body: `Merci pour votre retour, ${leadName} ! C'est super d'avoir votre perspective. Pour vous donner un aperçu de notre travail sur le marché ouest-africain, nous organisons un webinar sur la BRVM le 8 novembre. Seriez-vous curieux d'y participer ? Si oui, je vous partagerai le lien d'inscription avec plaisir.`,
      },
      {
        angle: "pedagogic_video",
        title: "Partage de Vidéo / Guide pédagogique",
        description: "Partage la vidéo la plus populaire ou le document pédagogique",
        subject: "Re: Échange BRVM",
        body: `Merci pour votre retour, ${leadName} ! C'est formidable que vous vous intéressiez à la zone UEMOA. Pour vous donner un bon aperçu de nos contenus, voici notre vidéo la plus populaire sur la BRVM : https://youtu.be/ex-brvm-martins. Prenez le temps de la regarder, et dites-moi ce que vous en pensez !`,
      },
      {
        angle: "open_conversation",
        title: "Question ouverte & découverte",
        description: "Approche naturelle pour faire connaissance par message sans brusquer",
        subject: "Re: Échange BRVM",
        body: `Merci pour ce partage, ${leadName} ! Le plaisir est partagé. Dites-moi, quel regard portez-vous sur la BRVM en ce moment ? Vous y investissez déjà activement ou c'est un marché que vous observez de loin pour l'instant ?`,
      },
    ];
  }

  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  try {
    const rawContent = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawContent) as { suggestions: ReplySuggestion[] };
    return parsed.suggestions || [];
  } catch (err) {
    console.error("Erreur de parsing des suggestions IA :", err);
    return [];
  }
}

