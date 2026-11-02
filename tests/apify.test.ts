import { describe, it, expect } from "vitest";
import { normalizeLinkedInUrl, parseLinkedInResult } from "@/lib/services/apify";

describe("Apify Parser & Normalizer", () => {
  it("normalise correctement les URLs LinkedIn (suppression query params, slash, sous-domaines)", () => {
    const raw1 = "https://ca.linkedin.com/in/amadou-diallo-12345/?utm_source=google&trk=profile";
    expect(normalizeLinkedInUrl(raw1)).toBe("https://www.linkedin.com/in/amadou-diallo-12345");

    const raw2 = "https://fr.linkedin.com/in/fatou-bamba/";
    expect(normalizeLinkedInUrl(raw2)).toBe("https://www.linkedin.com/in/fatou-bamba");
  });

  it("parse des titres LinkedIn réels avec séparateurs variés", () => {
    const res1 = parseLinkedInResult({
      title: "Amadou Diallo - Portfolio Manager - BNP Paribas | LinkedIn",
      url: "https://fr.linkedin.com/in/amadou-diallo",
      description: "Diplômé INP-HB Côte d'Ivoire. Expérience en gestion de portefeuille.",
    });

    expect(res1).not.toBeNull();
    expect(res1?.full_name).toBe("Amadou Diallo");
    expect(res1?.first_name).toBe("Amadou");
    expect(res1?.last_name).toBe("Diallo");
    expect(res1?.current_title).toBe("Portfolio Manager");
    expect(res1?.current_company).toBe("BNP Paribas");
  });

  it("parse des profils avec mentions 'chez' et certifications (CFA, CPA)", () => {
    const res2 = parseLinkedInResult({
      title: "Fatou Bamba, CFA - Analyste Financier chez Desjardins - LinkedIn",
      url: "https://ca.linkedin.com/in/fatou-bamba",
      description: "Montréal. Ancienne de HEC Montréal et CESAG Dakar.",
    });

    expect(res2).not.toBeNull();
    expect(res2?.full_name).toBe("Fatou Bamba");
    expect(res2?.current_title).toBe("Analyste Financier");
    expect(res2?.current_company).toBe("Desjardins");
  });

  it("rejette les URLs qui ne sont pas des profils LinkedIn /in/", () => {
    const res = parseLinkedInResult({
      title: "Accueil - LinkedIn",
      url: "https://www.linkedin.com/feed/",
    });
    expect(res).toBeNull();
  });
});

