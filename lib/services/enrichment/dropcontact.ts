import "server-only";
import type { EmailProvider, EnrichmentInputLead, EnrichmentPollResponse, EnrichmentResult } from "./types";

export class DropcontactProvider implements EmailProvider {
  name = "dropcontact";

  private getApiKey(): string {
    const key = process.env.DROPCONTACT_API_KEY;
    if (!key) {
      throw new Error("Clé d'API DROPCONTACT_API_KEY absente.");
    }
    return key;
  }

  async submit(leads: EnrichmentInputLead[]): Promise<string> {
    const apiKey = this.getApiKey();

    const data = leads.map((l) => ({
      first_name: l.first_name || l.full_name.split(" ")[0] || "",
      last_name: l.last_name || l.full_name.split(" ").slice(1).join(" ") || "",
      company: l.current_company || "",
      linkedin: l.linkedin_url,
      // On passe l'identifiant pour retrouver le lead dans les résultats
      custom_id: l.id,
    }));

    const res = await fetch("https://api.dropcontact.io/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Token": apiKey,
      },
      body: JSON.stringify({ data, num_request: 1 }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Erreur Dropcontact (${res.status}): ${errText}`);
    }

    const json = await res.json();
    return json.request_id;
  }

  async poll(jobRef: string): Promise<EnrichmentPollResponse> {
    const apiKey = this.getApiKey();

    const res = await fetch(`https://api.dropcontact.io/batch/${jobRef}`, {
      method: "GET",
      headers: {
        "X-Access-Token": apiKey,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        completed: false,
        results: [],
        error: `Dropcontact poll error (${res.status}): ${errText}`,
      };
    }

    const json = await res.json();

    // Dropcontact répond avec `success: true` et liste `data` si le traitement est terminé
    if (!json.data || json.data.length === 0) {
      return { completed: false, results: [] };
    }

    const results: EnrichmentResult[] = [];

    for (const item of json.data) {
      const leadId = item.custom_id;
      if (!leadId) continue;

      let email: string | null = null;
      let status: "verified" | "risky" | "not_found" = "not_found";

      if (Array.isArray(item.email) && item.email.length > 0) {
        const primary = item.email[0];
        email = primary.email || null;
        const qualification = primary.qualification || "";

        if (qualification === "nominative@pro" || qualification === "pro") {
          status = "verified";
        } else if (qualification === "catch_all") {
          status = "risky";
        } else if (email) {
          status = "verified";
        }
      }

      results.push({ leadId, email, status });
    }

    return {
      completed: true,
      results,
    };
  }
}

export const dropcontactProvider = new DropcontactProvider();

