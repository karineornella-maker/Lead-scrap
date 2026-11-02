import { describe, it, expect } from "vitest";
import { buildXRayQueries, getLinkedInDomain } from "@/lib/services/xray";
import type { Campaign } from "@/lib/types";

describe("buildXRayQueries", () => {
  it("retourne le bon domaine selon le pays cible", () => {
    expect(getLinkedInDomain("CA")).toBe("ca.linkedin.com/in");
    expect(getLinkedInDomain("FR")).toBe("fr.linkedin.com/in");
    expect(getLinkedInDomain("BE")).toBe("be.linkedin.com/in");
    expect(getLinkedInDomain("CH")).toBe("ch.linkedin.com/in");
    expect(getLinkedInDomain("US")).toBe("www.linkedin.com/in");
  });

  it("génère des requêtes cross_filter croisant université, marqueurs UEMOA et rôles", () => {
    const campaign: Campaign = {
      id: "test-campaign-1",
      name: "HEC Montréal & Finance",
      target_region: "north-america",
      target_country: "CA",
      target_universities: ["hec-montreal"],
      target_roles: ["finance", "audit"],
      target_groups: [],
      group_mode: "cross_filter",
      batch_size: 20,
      status: "draft",
      created_by: null,
      created_at: new Date().toISOString(),
    };

    const queries = buildXRayQueries(campaign);
    expect(queries.length).toBeGreaterThan(0);
    expect(queries[0]).toContain("site:ca.linkedin.com/in");
    expect(queries[0]).toContain("HEC");
    // Vérifie que les requêtes ne sont pas trop longues (Google limite à ~32 termes)
    for (const q of queries) {
      const termCount = q.split(/\s+/).length;
      expect(termCount).toBeLessThan(35);
    }
  });

  it("génère des requêtes standalone avec des groupes choisis", () => {
    const campaign: Campaign = {
      id: "test-campaign-2",
      name: "Réseau RPAC Canada",
      target_region: "north-america",
      target_country: "CA",
      target_universities: [],
      target_roles: ["finance"],
      target_groups: ["rpac"],
      group_mode: "standalone",
      batch_size: 10,
      status: "draft",
      created_by: null,
      created_at: new Date().toISOString(),
    };

    const queries = buildXRayQueries(campaign);
    expect(queries.length).toBeGreaterThan(0);
    expect(queries[0]).toContain("site:ca.linkedin.com/in");
    expect(queries[0]).toContain("RPAC");
  });

  it("génère des requêtes autonomes SANS AUCUN groupe imposé (liberté totale)", () => {
    const campaign: Campaign = {
      id: "test-campaign-3",
      name: "Prospection Autonome Libre",
      target_region: "north-america",
      target_country: "CA",
      target_universities: [],
      target_roles: ["finance", "banking"],
      target_groups: [], // Zéro groupe imposé
      group_mode: "standalone",
      batch_size: 20,
      status: "draft",
      created_by: null,
      created_at: new Date().toISOString(),
    };

    const queries = buildXRayQueries(campaign);
    expect(queries.length).toBeGreaterThan(0);
    expect(queries[0]).toContain("site:ca.linkedin.com/in");
    // Les requêtes ciblent directement les marqueurs et les métiers sans exiger de groupe
    expect(queries.some((q) => q.includes("finance") || q.includes("banque"))).toBe(true);
  });
});
