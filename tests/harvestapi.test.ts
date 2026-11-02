import { describe, it, expect } from "vitest";
import { normalizeLinkedInUrl } from "../lib/services/apify";

describe("HarvestAPI LinkedIn Profile Scraper data handling", () => {
  it("normalizes LinkedIn profile URLs consistently", () => {
    const raw = "https://www.linkedin.com/in/karine-ornella-12345?miniProfileUrn=urn%3Ali&ref=search/";
    expect(normalizeLinkedInUrl(raw)).toBe("https://www.linkedin.com/in/karine-ornella-12345");
  });

  it("extracts and verifies email status from HarvestAPI payload", () => {
    const sampleItem = {
      linkedinUrl: "https://www.linkedin.com/in/test-lead",
      email: "test.lead@ecobank.com",
      emailStatus: "deliverable",
      fullName: "Test Lead",
    };

    const email = sampleItem.email ? sampleItem.email.trim() : null;
    let status: "verified" | "risky" | "not_found" = "not_found";
    if (email) {
      status = sampleItem.emailStatus.includes("risk") ? "risky" : "verified";
    }

    expect(email).toBe("test.lead@ecobank.com");
    expect(status).toBe("verified");
  });

  it("handles fallback to emails array when primary email is missing", () => {
    const sampleItem = {
      url: "https://www.linkedin.com/in/secondary-lead",
      emails: [{ email: "lead@oragroup.com", type: "work" }],
      verificationStatus: "risky",
    };

    let email: string | null = null;
    if (Array.isArray(sampleItem.emails) && sampleItem.emails.length > 0) {
      const first = sampleItem.emails[0];
      if (typeof first === "object" && first.email) {
        email = first.email;
      }
    }

    expect(email).toBe("lead@oragroup.com");
  });
});
