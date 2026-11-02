import "server-only";
import { ApifyClient } from "apify-client";
import { normalizeLinkedInUrl } from "../apify";
import type {
  EmailProvider,
  EnrichmentInputLead,
  EnrichmentPollResponse,
  EnrichmentResult,
} from "./types";

export interface HarvestProfileOutput {
  linkedinUrl?: string;
  url?: string;
  publicIdentifier?: string;
  originalQuery?: { query?: string };
  email?: string | null;
  emails?: Array<{ email?: string; status?: string; deliverable?: boolean; type?: string } | string>;
  emailStatus?: string;
  verificationStatus?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  location?: unknown;
  company?: string;
}

export class HarvestApiProvider implements EmailProvider {
  name = "harvestapi";

  private getClient(): ApifyClient {
    const token = process.env.APIFY_TOKEN;
    if (!token) {
      throw new Error("Variable d'environnement APIFY_TOKEN absente pour HarvestAPI.");
    }
    return new ApifyClient({ token });
  }

  /**
   * Lance l'acteur harvestapi/linkedin-profile-scraper en mode email search
   */
  async submit(leads: EnrichmentInputLead[]): Promise<string> {
    const client = this.getClient();
    const urls = leads.map((l) => l.linkedin_url).filter(Boolean);

    if (urls.length === 0) {
      throw new Error("Aucune URL LinkedIn valide fournie pour l'enrichissement HarvestAPI.");
    }

    const run = await client.actor("harvestapi/linkedin-profile-scraper").start({
      queries: urls,
      profileScraperMode: "Profile details + email search ($10 per 1k)",
    });

    return run.id;
  }

  /**
   * Vérifie l'état du run Apify HarvestAPI et extrait les emails trouvés
   */
  async poll(
    jobRef: string,
    leadsMap?: Map<string, string>,
  ): Promise<EnrichmentPollResponse> {
    const client = this.getClient();
    const run = await client.run(jobRef).get();

    if (!run) {
      return { completed: false, results: [], error: "Run Apify HarvestAPI introuvable." };
    }

    if (run.status === "RUNNING" || run.status === "READY") {
      return { completed: false, results: [] };
    }

    if (run.status !== "SUCCEEDED") {
      return {
        completed: true,
        results: [],
        error: `Le run Apify s'est terminé avec le statut : ${run.status}`,
      };
    }

    if (!run.defaultDatasetId) {
      return { completed: true, results: [] };
    }

    const dataset = await client.dataset(run.defaultDatasetId).listItems();
    const items = dataset.items as HarvestProfileOutput[];

    // Indexation des résultats par URL LinkedIn normalisée
    const resultsByUrl = new Map<
      string,
      { email: string | null; status: "verified" | "risky" | "not_found" }
    >();

    for (const item of items) {
      const rawUrl =
        item.originalQuery?.query ||
        item.linkedinUrl ||
        item.url ||
        (item.publicIdentifier
          ? `https://www.linkedin.com/in/${item.publicIdentifier}`
          : "");
      if (!rawUrl) continue;

      let email: string | null = null;
      let status: "verified" | "risky" | "not_found" = "not_found";

      if (typeof item.email === "string" && item.email.includes("@")) {
        email = item.email.trim();
      } else if (Array.isArray(item.emails) && item.emails.length > 0) {
        const first = item.emails[0];
        if (typeof first === "string" && first.includes("@")) {
          email = first.trim();
        } else if (first && typeof first === "object" && typeof first.email === "string" && first.email.includes("@")) {
          email = first.email.trim();
          const firstStatus = String(first.status || "").toLowerCase();
          status = firstStatus.includes("risk") ? "risky" : "verified";
        }
      }

      if (email && status === "not_found") {
        const itemStatus = String(item.emailStatus || item.verificationStatus || "").toLowerCase();
        status = itemStatus.includes("risk") ? "risky" : "verified";
      }

      const cleanUrl = normalizeLinkedInUrl(rawUrl).toLowerCase();
      resultsByUrl.set(cleanUrl, { email, status });

      if (item.publicIdentifier) {
        resultsByUrl.set(item.publicIdentifier.toLowerCase(), { email, status });
      }
      if (item.linkedinUrl) {
        resultsByUrl.set(normalizeLinkedInUrl(item.linkedinUrl).toLowerCase(), { email, status });
      }
      if (item.originalQuery?.query) {
        resultsByUrl.set(normalizeLinkedInUrl(item.originalQuery.query).toLowerCase(), { email, status });
      }
    }

    // Réconciliation avec les IDs des leads locaux
    const results: EnrichmentResult[] = [];
    if (leadsMap) {
      for (const [leadId, rawUrl] of leadsMap.entries()) {
        if (!rawUrl) {
          results.push({ leadId, email: null, status: "not_found" });
          continue;
        }
        const clean = normalizeLinkedInUrl(rawUrl).toLowerCase();
        const slug = clean.split("/in/")[1]?.split("/")[0]?.split("?")[0]?.toLowerCase();
        const found = resultsByUrl.get(clean) || (slug ? resultsByUrl.get(slug) : undefined);
        results.push({
          leadId,
          email: found?.email || null,
          status: found ? found.status : "not_found",
        });
      }
    }

    return {
      completed: true,
      results,
    };
  }
}

export const harvestApiProvider = new HarvestApiProvider();

