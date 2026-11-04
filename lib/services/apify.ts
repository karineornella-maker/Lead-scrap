import { ApifyClient } from "apify-client";

export interface RawSearchResult {
  title: string;
  url: string;
  description?: string;
  snippet?: string;
  searchQueryTerm?: string;
}

export interface ParsedProfile {
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  current_title: string | null;
  current_company: string | null;
  linkedin_url: string;
  source_snippet: string | null;
  search_query?: string | null;
}

/**
 * Normalise l'URL LinkedIn pour le dédoublonnage strict :
 * - supprime query params (?...) et hash (#...)
 * - supprime le slash final
 * - ramène le sous-domaine (ex: ca.linkedin.com, fr.linkedin.com) vers www.linkedin.com
 */
export function normalizeLinkedInUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    const url = new URL(rawUrl.trim());
    const pathname = url.pathname.replace(/\/+$/, "");
    return `https://www.linkedin.com${pathname}`;
  } catch {
    return rawUrl.trim().split("?")[0].replace(/\/+$/, "");
  }
}

/**
 * Parse le titre Google d'un profil LinkedIn :
 * Exemples réels :
 * - "Amadou Diallo - Portfolio Manager - BNP Paribas | LinkedIn"
 * - "Fatou Bamba, CFA - Analyste Financier chez Desjardins | LinkedIn"
 * - "Koffi Mensah - Senior Consultant - Deloitte | LinkedIn"
 */
export function parseLinkedInResult(result: RawSearchResult): ParsedProfile | null {
  const cleanUrl = normalizeLinkedInUrl(result.url);
  if (!cleanUrl.includes("linkedin.com/in/")) {
    return null;
  }

  // Nettoyage du titre (retire le suffixe | LinkedIn ou - LinkedIn)
  const rawTitle = result.title.replace(/\s*[-|]\s*LinkedIn.*$/i, "").trim();

  // Découpage selon les séparateurs classiques (" - " ou " chez " ou " at ")
  const parts = rawTitle.split(/\s+[-–—]\s+/);
  const fullNameRaw = (parts[0] || "").replace(/,\s*(CFA|MBA|FRM|PhD|CPA).*$/i, "").trim();

  if (!fullNameRaw) return null;

  // Extraction prénom / nom
  const nameParts = fullNameRaw.split(/\s+/).filter(Boolean);
  const firstName = nameParts.length > 1 ? nameParts[0] : fullNameRaw;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

  let currentTitle: string | null = null;
  let currentCompany: string | null = null;

  if (parts.length >= 3) {
    currentTitle = parts[1].trim();
    currentCompany = parts[2].trim();
  } else if (parts.length === 2) {
    const secondPart = parts[1].trim();
    if (secondPart.includes(" chez ")) {
      const sub = secondPart.split(" chez ");
      currentTitle = sub[0]?.trim() || null;
      currentCompany = sub[1]?.trim() || null;
    } else if (secondPart.includes(" at ")) {
      const sub = secondPart.split(" at ");
      currentTitle = sub[0]?.trim() || null;
      currentCompany = sub[1]?.trim() || null;
    } else {
      currentTitle = secondPart;
    }
  }

  return {
    full_name: fullNameRaw,
    first_name: firstName || null,
    last_name: lastName || null,
    current_title: currentTitle,
    current_company: currentCompany,
    linkedin_url: cleanUrl,
    source_snippet: result.description || result.snippet || null,
    search_query: result.searchQueryTerm || null,
  };
}

/**
 * Lance le scraper Google Search sur Apify avec un webhook.
 */
export async function startXRayRun(campaignId: string, queries: string[]): Promise<string> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("Variable d'environnement APIFY_TOKEN manquante.");
  }

  const client = new ApifyClient({ token });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookSecret = process.env.APIFY_WEBHOOK_SECRET || "";

  const webhooks = [];
  if (appUrl && !appUrl.includes("localhost")) {
    webhooks.push({
      eventTypes: ["ACTOR.RUN.SUCCEEDED" as const, "ACTOR.RUN.FAILED" as const],
      requestUrl: `${appUrl}/api/webhooks/apify?secret=${encodeURIComponent(webhookSecret)}&campaignId=${campaignId}`,
    });
  }

  const run = await client.actor("apify/google-search-scraper").start(
    {
      queries: queries.join("\n"),
      maxPagesPerQuery: 1,
      resultsPerPage: 20,
      mobileResults: false,
    },
    { webhooks },
  );

  return run.id;
}

/**
 * Récupère les résultats organiques d'un run Apify terminé.
 */
export async function fetchRunResults(runId: string): Promise<RawSearchResult[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("Variable d'environnement APIFY_TOKEN manquante.");
  }

  const client = new ApifyClient({ token });
  // Attend jusqu'à 30 secondes que le scraper termine son exécution
  const run = await client.run(runId).waitForFinish({ waitSecs: 30 });

  if (run?.status === "RUNNING") {
    throw new Error(
      "Le scraping Google X-Ray est encore en cours sur Apify. Veuillez patienter quelques instants puis recliquer sur Synchroniser.",
    );
  }

  if (run?.status === "FAILED" || run?.status === "ABORTED" || run?.status === "TIMED-OUT") {
    throw new Error(`Le scraper Apify s'est arrêté avec le statut : ${run.status}.`);
  }

  if (!run?.defaultDatasetId) {
    return [];
  }

  const dataset = await client.dataset(run.defaultDatasetId).listItems();
  const rawResults: RawSearchResult[] = [];

  for (const item of dataset.items as Array<Record<string, unknown>>) {
    const queryTerm = (item.searchQuery as { term?: string } | undefined)?.term || "";
    if (Array.isArray(item.organicResults)) {
      for (const org of item.organicResults as Array<Record<string, string>>) {
        if (org.url && org.title) {
          rawResults.push({
            title: org.title,
            url: org.url,
            description: org.description || org.snippet || "",
            searchQueryTerm: queryTerm,
          });
        }
      }
    }
  }

  return rawResults;
}

