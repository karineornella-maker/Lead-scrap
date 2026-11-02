import { describe, it, expect } from "vitest";
import { generateMessage } from "../lib/services/copywriting";
import type { Lead } from "../lib/types";

describe("Copywriting generator", () => {
  const dummyLead: Lead = {
    id: "lead-1",
    campaign_id: "camp-1",
    full_name: "Amadou Diallo",
    first_name: "Amadou",
    last_name: "Diallo",
    current_title: "Portfolio Manager",
    current_company: "BNP Paribas",
    company_domain: "bnpparibas.com",
    location: "Paris, France",
    linkedin_url: "https://www.linkedin.com/in/amadou-diallo",
    western_education: "HEC Paris",
    uemoa_ties: "Sénégal · Diplômé CESAG",
    uemoa_affinity_score: 85,
    email_status: "verified",
    business_email: "amadou.diallo@bnp.com",
    ai_personalized_message: null,
    created_at: new Date().toISOString(),
    source_snippet: "Analyste et gérant d'actifs",
  };

  it("generates a legally compliant simulation email with unsubscribe footer", async () => {
    const res = await generateMessage(dummyLead);

    expect(res.provider).toBe("simulation");
    expect(res.subject).toContain("BRVM");
    expect(res.body).toContain("Bonjour Amadou");
    expect(res.body).toContain("HEC Paris");
    expect(res.body).toContain("Sénégal · Diplômé CESAG");
    expect(res.fullMessage).toContain("Données issues de votre profil public LinkedIn");
    expect(res.fullMessage).toContain("/unsubscribe?");
    expect(res.fullMessage).toContain("token=");
  });
});
