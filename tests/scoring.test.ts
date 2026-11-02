import { describe, it, expect } from "vitest";
import { scoreLead } from "@/lib/services/scoring";

describe("Score d'affinité UEMOA (lib/services/scoring.ts)", () => {
  it("renvoie 0 si aucun signal factuel n'est trouvé", () => {
    const res = scoreLead({
      title: "Software Engineer at Google",
      snippet: "Based in Seattle, computer science graduate from MIT.",
      education: "MIT",
    });

    expect(res.score).toBe(0);
    expect(res.ties.length).toBe(0);
  });

  it("accorde des points pour une école africaine (+35) et expérience UEMOA (+25)", () => {
    const res = scoreLead({
      title: "Auditeur Financier - PwC",
      snippet: "Ancien élève INP-HB à Yamoussoukro, expérience à Abidjan (Côte d'Ivoire).",
      education: "HEC Paris",
    });

    // 35 (INP-HB) + 25 (Côte d'Ivoire) + 10 (Finance/Audit) = 70
    expect(res.score).toBe(70);
    expect(res.ties.some((t) => t.includes("INP-HB"))).toBe(true);
    expect(res.ties.some((t) => t.includes("Côte d'Ivoire"))).toBe(true);
  });

  it("règle Maroc : n'accorde PAS de bonus Maroc si AUCUN signal subsaharien n'est présent", () => {
    const res = scoreLead({
      title: "Chef de projet",
      snippet: "Diplômé ENCG Casablanca au Maroc. Passionné de management.",
      education: null,
    });

    // Pas de signal subsaharien, donc bonus Maroc = 0
    expect(res.score).toBe(0);
    expect(res.ties.some((t) => t.includes("Maroc"))).toBe(false);
  });

  it("règle Maroc : accorde le bonus Maroc (+10) si un signal subsaharien est présent", () => {
    const res = scoreLead({
      title: "Analyste M&A",
      snippet: "Diplômé ENCG Casablanca, stage de fin d'études à Dakar au Sénégal.",
      education: null,
    });

    // 25 (Sénégal) + 10 (Maroc ENCG avec signal validé) + 10 (Analyste M&A / finance) = 45
    expect(res.score).toBe(45);
    expect(res.ties.some((t) => t.includes("ENCG"))).toBe(true);
    expect(res.ties.some((t) => t.includes("Sénégal"))).toBe(true);
  });

  it("plafonne strictement le score à 100 même avec accumulation de signaux", () => {
    const res = scoreLead({
      title: "Portfolio Manager, Directeur des investissements",
      snippet:
        "Diplômé INP-HB (35) et CESAG (35). 5 ans d'expérience à Abidjan (25) et Douala Cameroun (15). Membre actif du RPAC (20). Ancien de ENCG Maroc (10).",
      education: "HEC Montréal",
    });

    // Total brut théorique > 140 -> doit être plafonné à 100
    expect(res.score).toBe(100);
  });
});

