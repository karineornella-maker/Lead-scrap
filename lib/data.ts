import universitiesJson from "@/data/universities.json";
import affinityGroupsJson from "@/data/affinity-groups.json";
import type { AffinityCategory, Country, Region } from "@/lib/types";

export const regions = universitiesJson as Region[];
export const affinityCategories = affinityGroupsJson as AffinityCategory[];

export const MIN_UEMOA_SCORE = 30;

// CLAUDE.md §3 : filtre de pouvoir d'achat
export const targetRoles = [
  { id: "finance", label: "Finance" },
  { id: "banking", label: "Banque" },
  { id: "portfolio", label: "Gestion de portefeuille" },
  { id: "audit", label: "Audit" },
  { id: "consulting", label: "Conseil" },
  { id: "it-engineering", label: "IT / Ingénierie" },
  { id: "management", label: "Management" },
  { id: "directors", label: "Directeurs" },
] as const;

export function findCountry(code: string): { region: Region; country: Country } | null {
  for (const region of regions) {
    const country = region.countries.find((c) => c.code === code);
    if (country) return { region, country };
  }
  return null;
}

export function countryUniversityIds(country: Country): string[] {
  return country.groups.flatMap((g) => g.universities.map((u) => u.id));
}

export const allAffinityGroupIds = affinityCategories.flatMap((c) => c.groups.map((g) => g.id));

const universityNames = new Map(
  regions.flatMap((r) =>
    r.countries.flatMap((c) => c.groups.flatMap((g) => g.universities.map((u) => [u.id, u.name] as const))),
  ),
);

export function universityName(id: string): string {
  return universityNames.get(id) ?? id;
}
