import { describe, it, expect } from "vitest";
import { generateCsv, generateWaalaxyCsv } from "@/lib/services/export";
import type { Lead } from "@/lib/types";

describe("Générateur d'Export CSV (lib/services/export.ts)", () => {
  it("génère un CSV UTF-8 avec BOM et séparateur point-virgule pour Excel français", () => {
    const leads: Lead[] = [
      {
        id: "lead-1",
        campaign_id: "c-1",
        full_name: "Koffi Mensah",
        first_name: "Koffi",
        last_name: "Mensah",
        current_title: "Senior Consultant",
        current_company: "Deloitte; France", // contient un point-virgule
        company_domain: "deloitte.fr",
        location: "Paris",
        linkedin_url: "https://www.linkedin.com/in/koffi-mensah",
        western_education: "Dauphine",
        uemoa_ties: "Diplômé INP-HB · Expérience Côte d'Ivoire",
        uemoa_affinity_score: 75,
        business_email: "koffi.mensah@deloitte.fr",
        email_status: "verified",
        ai_personalized_message: "Bonjour Koffi,\nOpportunités sur la BRVM.",
        ai_subject: "Diversification BRVM",
        created_at: new Date().toISOString(),
      },
    ];

    const csv = generateCsv(leads);

    // 1. Doit commencer par le BOM UTF-8 (\uFEFF)
    expect(csv.charCodeAt(0)).toBe(0xfeff);

    // 2. Doit utiliser le point-virgule comme séparateur
    expect(csv).toContain("Nom complet;Prénom;Nom;Poste;Entreprise");

    // 3. Doit échapper correctement les champs contenant des points-virgules
    expect(csv).toContain('"Deloitte; France"');

    // 4. Doit contenir les données
    expect(csv).toContain("Koffi Mensah");
    expect(csv).toContain("koffi.mensah@deloitte.fr");
  });

  it("génère un CSV 100% conforme au format officiel Waalaxy (URL LinkedIn,Email,Prénom,Nom,Poste,Entreprise)", () => {
    const leads: Lead[] = [
      {
        id: "lead-1",
        campaign_id: "c-1",
        full_name: "Jean Dupont",
        first_name: "Jean",
        last_name: "Dupont",
        current_title: "CEO",
        current_company: "ABC Company",
        company_domain: "abccompany.com",
        location: "Paris, France",
        linkedin_url: "https://www.linkedin.com/in/jean-dupont",
        western_education: "HEC",
        uemoa_ties: "Diplômé CESAG",
        uemoa_affinity_score: 80,
        business_email: "jean.dupont@email.com",
        email_status: "verified",
        ai_personalized_message: "Bonjour Jean",
        ai_subject: "Sujet",
        created_at: new Date().toISOString(),
      },
    ];

    const waalaxyCsv = generateWaalaxyCsv(leads);

    expect(waalaxyCsv.charCodeAt(0)).toBe(0xfeff);
    expect(waalaxyCsv).toContain("URL LinkedIn,Email,Email Pro,Prénom,Nom,Poste,Entreprise,Message,Région");
    expect(waalaxyCsv).toContain('https://www.linkedin.com/in/jean-dupont,jean.dupont@email.com,jean.dupont@email.com,Jean,Dupont,CEO,ABC Company,Bonjour Jean,"Paris, France"');
  });
});

