import uemoaMarkersData from "@/data/uemoa-markers.json";
import affinityGroupsData from "@/data/affinity-groups.json";
import type { AffinityCategory } from "@/lib/types";

export interface ScoreInput {
  title?: string | null;
  snippet?: string | null;
  education?: string | null;
  groups?: string[] | null;
}

export interface ScoreResult {
  score: number;
  ties: string[];
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesTerm(normalizedText: string, term: string): boolean {
  const normTerm = normalizeText(term.trim());
  if (!normTerm) return false;

  // Si l'expression contient des espaces ou caractères spéciaux, match direct par sous-chaîne
  if (normTerm.includes(" ") || normTerm.includes("-") || normTerm.includes("'")) {
    return normalizedText.includes(normTerm);
  }

  // Pour un mot simple (ex: Mali, Togo, Niger, BEM, 2iE), exiger une frontière de mot pour éviter les faux positifs (ex: anomalie)
  const regex = new RegExp(`(^|[^a-z0-9])${escapeRegex(normTerm)}([^a-z0-9]|$)`, "i");
  return regex.test(normalizedText);
}

/**
 * Calcule de manière déterministe et auditable le score d'affinité UEMOA.
 * Conforme RGPD art. 9 : aucun calcul n'est basé sur le nom, l'ethnie ou l'origine supposée.
 * Seuls les faits académiques, professionnels et associatifs publics sont pris en compte.
 */
export function scoreLead(input: ScoreInput): ScoreResult {
  const combinedText = [
    input.title || "",
    input.snippet || "",
    input.education || "",
    ...(input.groups || []),
  ].join(" ");

  const normalized = normalizeText(combinedText);
  const ties: string[] = [];
  let score = 0;

  let hasSubsaharanSignal = false;

  const markers = uemoaMarkersData as {
    african_institutions: Array<{ name: string; aliases: string[]; country: string; weight: number }>;
    uemoa_countries: Array<{ name: string; aliases: string[]; weight: number }>;
    central_africa_countries: Array<{ name: string; aliases: string[]; weight: number }>;
    moroccan_institutions: Array<{ name: string; aliases: string[]; requires_subsaharan_signal: boolean; weight: number }>;
    role_keywords: Record<string, string[]>;
  };

  // 1. Écoles et lycées africains (+35)
  for (const inst of markers.african_institutions) {
    const terms = [inst.name, ...(inst.aliases || [])];
    const matched = terms.some((term) => matchesTerm(normalized, term));
    if (matched) {
      score += inst.weight || 35;
      ties.push(`Diplômé ou ancien de ${inst.name} (${inst.country})`);
      hasSubsaharanSignal = true;
      break; // Un seul bonus école africaine
    }
  }

  // 2. Expérience / liens pays UEMOA (+25)
  for (const country of markers.uemoa_countries) {
    const terms = [country.name, ...(country.aliases || [])];
    const matched = terms.some((term) => matchesTerm(normalized, term));
    if (matched) {
      score += country.weight || 25;
      ties.push(`Expérience ou rattachement : ${country.name}`);
      hasSubsaharanSignal = true;
      break; // Un seul bonus pays UEMOA
    }
  }

  // 3. Afrique centrale & Grands Lacs (+15)
  for (const country of markers.central_africa_countries) {
    const terms = [country.name, ...(country.aliases || [])];
    const matched = terms.some((term) => matchesTerm(normalized, term));
    if (matched) {
      score += country.weight || 15;
      ties.push(`Expérience ou rattachement : ${country.name}`);
      hasSubsaharanSignal = true;
      break;
    }
  }

  // 4. Réseaux et clubs d'intérêt (§4 de CLAUDE.md) (+20)
  const affinityCategories = affinityGroupsData as AffinityCategory[];
  const allGroups = affinityCategories.flatMap((c) => c.groups);
  for (const grp of allGroups) {
    const terms = [grp.name, ...(grp.keywords || [])];
    const matched = terms.some((term) => matchesTerm(normalized, term));
    if (matched) {
      score += 20;
      ties.push(`Membre / Affilié : ${grp.name}`);
      hasSubsaharanSignal = true;
      break;
    }
  }

  // 5. Filière spécifique Maroc (+10 si et seulement si un autre signal subsaharien est validé)
  for (const inst of markers.moroccan_institutions) {
    const terms = [inst.name, ...(inst.aliases || [])];
    const matched = terms.some((term) => matchesTerm(normalized, term));
    if (matched) {
      if (hasSubsaharanSignal) {
        score += inst.weight || 10;
        ties.push(`Formation Maroc : ${inst.name} (avec signal subsaharien validé)`);
      }
      break;
    }
  }

  // 6. Métier cible / Investisseur potentiel (+10)
  // Règle "aucun signal -> 0" : le bonus métier cible s'applique si au moins un signal d'affinité subsaharien ou africain est identifié
  if (hasSubsaharanSignal) {
    let roleMatched = false;
    for (const [, keywords] of Object.entries(markers.role_keywords)) {
      if (keywords.some((kw) => matchesTerm(normalized, kw))) {
        roleMatched = true;
        break;
      }
    }
    if (roleMatched) {
      score += 10;
      ties.push("Profil métier finance / décisionnaire ciblé");
    }
  }

  // Si aucun signal factuel n'a été trouvé, le score d'affinité reste strictement à 0
  if (ties.length === 0) {
    return { score: 0, ties: [] };
  }

  // Plafond strict à 100
  const finalScore = Math.min(100, Math.max(0, score));

  return {
    score: finalScore,
    ties,
  };
}
