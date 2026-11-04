import universitiesData from "@/data/universities.json";
import affinityGroupsData from "@/data/affinity-groups.json";
import uemoaMarkersData from "@/data/uemoa-markers.json";
import type { Campaign, Region, AffinityCategory } from "@/lib/types";

const DOMAIN_MAP: Record<string, string> = {
  CA: "ca.linkedin.com/in",
  FR: "fr.linkedin.com/in",
  BE: "be.linkedin.com/in",
  CH: "ch.linkedin.com/in",
  LU: "lu.linkedin.com/in",
  US: "www.linkedin.com/in",
};

export function getLinkedInDomain(countryCode: string): string {
  return DOMAIN_MAP[countryCode.toUpperCase()] ?? "www.linkedin.com/in";
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function quote(str: string): string {
  const clean = str.replace(/"/g, "").trim();
  return clean.includes(" ") ? `"${clean}"` : clean;
}

function orGroup(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return quote(items[0]);
  return `(${items.map(quote).join(" OR ")})`;
}

/**
 * Construit les requêtes Google Dork / X-Ray Search pour une campagne donnée.
 * Supporte la sélection multi-pays (ex: Suisse + Belgique + France).
 * Les requêtes restent sous la limite de ~32 termes de Google.
 */
export function buildXRayQueries(campaign: Campaign): string[] {
  // Détermination de la liste des pays cibles (multi-pays ou mono-pays)
  const countries =
    campaign.target_countries && campaign.target_countries.length > 0
      ? campaign.target_countries
      : campaign.target_country
        ? campaign.target_country.includes(",")
          ? campaign.target_country.split(",").map((c) => c.trim().toUpperCase())
          : [campaign.target_country.toUpperCase()]
        : ["FR"];

  // Construction du préfixe site LinkedIn pour chaque pays
  const sitePrefixes = countries.map((c) => `site:${getLinkedInDomain(c)}`);

  // Récupération des rôles cibles
  const roleKeywords: string[] = [];
  const markers = uemoaMarkersData as {
    african_institutions: Array<{ name: string; aliases: string[] }>;
    uemoa_countries: Array<{ name: string; aliases: string[] }>;
    role_keywords: Record<string, string[]>;
  };

  const selectedRoles = campaign.target_roles.length > 0 ? campaign.target_roles : ["finance", "audit"];
  for (const role of selectedRoles) {
    const list = markers.role_keywords[role];
    if (list && list.length > 0) {
      roleKeywords.push(list[0]); // Mot-clé principal
      if (list[1]) roleKeywords.push(list[1]);
    } else {
      roleKeywords.push(role);
    }
  }
  const roleGroup = orGroup(roleKeywords.slice(0, 4));

  const queries: string[] = [];

  for (const sitePrefix of sitePrefixes) {
    if (campaign.group_mode === "standalone") {
      // Mode Autonome : l'utilisateur cible des groupes ou marqueurs
      const selectedGroupIds = new Set(campaign.target_groups);

      if (selectedGroupIds.size > 0) {
        const affinityCategories = affinityGroupsData as AffinityCategory[];
        const allGroups = affinityCategories.flatMap((c) => c.groups);
        const targetGroups = allGroups.filter((g) => selectedGroupIds.has(g.id));

        for (const group of targetGroups) {
          const groupTerms = [group.name, ...group.keywords].slice(0, 3);
          const groupStr = orGroup(groupTerms);
          const query = roleGroup ? `${sitePrefix} ${groupStr} ${roleGroup}` : `${sitePrefix} ${groupStr}`;
          queries.push(query);
        }
      } else {
        const institutionMarkers = markers.african_institutions.map((i) => i.name);
        const countryMarkers = markers.uemoa_countries.map((c) => c.name);
        const allAfricanMarkers = [...institutionMarkers.slice(0, 8), ...countryMarkers.slice(0, 4)];
        const markerPackets = chunkArray(allAfricanMarkers, 3);

        for (const packet of markerPackets) {
          const markerGroup = orGroup(packet);
          const query = roleGroup
            ? `${sitePrefix} ${markerGroup} ${roleGroup}`
            : `${sitePrefix} ${markerGroup}`;
          queries.push(query);
        }
      }
    } else {
      // Mode Cross-Filter : croisement Établissement/Formation × Marqueurs Africains × Métiers
      const regions = universitiesData as Region[];
      const allUnis = regions
        .flatMap((r) => r.countries)
        .flatMap((c) => c.groups)
        .flatMap((g) => g.universities);

      const selectedUniIds = new Set(campaign.target_universities);
      const targetUnis =
        selectedUniIds.size > 0 ? allUnis.filter((u) => selectedUniIds.has(u.id)) : allUnis.slice(0, 3);

      // Paquets de marqueurs africains (institutions & pays clés)
      const institutionMarkers = markers.african_institutions.map((i) => i.name);
      const countryMarkers = markers.uemoa_countries.map((c) => c.name);
      const allAfricanMarkers = [...institutionMarkers.slice(0, 8), ...countryMarkers.slice(0, 4)];
      const markerPackets = chunkArray(allAfricanMarkers, 3);

      for (const uni of targetUnis) {
        const uniTerms = [uni.name, ...(uni.aliases || [])].slice(0, 2);
        const uniGroup = orGroup(uniTerms);

        for (const packet of markerPackets) {
          const markerGroup = orGroup(packet);
          const query = roleGroup
            ? `${sitePrefix} ${uniGroup} ${markerGroup} ${roleGroup}`
            : `${sitePrefix} ${uniGroup} ${markerGroup}`;
          queries.push(query);
        }
      }
    }
  }

  // Plafonnement raisonnable selon batch_size (chaque requête Google ramène ~10 résultats)
  const maxQueries = Math.max(1, Math.min(50, Math.ceil(campaign.batch_size / 5)));
  return queries.slice(0, maxQueries);
}
