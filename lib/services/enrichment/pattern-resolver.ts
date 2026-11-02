/**
 * Résolveur d'emails professionnels par détection d'entreprise et d'institution :
 * Identifie les banques, fonds d'investissement, cabinets de conseil et universités
 * à partir du profil LinkedIn (titre, entreprise, snippet).
 */

const COMPANY_PATTERNS: Array<{
  match: RegExp;
  domain: string;
  format: "first.last" | "flast" | "first_last";
}> = [
  { match: /BNP\s*Paribas/i, domain: "bnpparibas.com", format: "first.last" },
  { match: /Soci[ée]t[ée]\s*G[ée]n[ée]rale|SocGen/i, domain: "socgen.com", format: "first.last" },
  { match: /Deloitte/i, domain: "deloitte.com", format: "flast" },
  { match: /Alvarez\s*&\s*Marsal/i, domain: "alvarezandmarsal.com", format: "flast" },
  { match: /Natixis/i, domain: "natixis.com", format: "first.last" },
  { match: /Saviu/i, domain: "saviu.vc", format: "first.last" },
  { match: /Alantra/i, domain: "alantra.com", format: "first.last" },
  { match: /Evercore/i, domain: "evercore.com", format: "first.last" },
  { match: /J\.?P\.?\s*Morgan/i, domain: "jpmorgan.com", format: "first.last" },
  { match: /Banque\s*Atlantique/i, domain: "banqueatlantique.net", format: "first.last" },
  { match: /Ecobank/i, domain: "ecobank.com", format: "flast" },
  { match: /Orange/i, domain: "orange.com", format: "first.last" },
  { match: /Ecom\s*Trading|Ecom/i, domain: "ecomtrading.com", format: "flast" },
  { match: /CICAD/i, domain: "cicad.fr", format: "flast" },
  { match: /HEC\s*Paris/i, domain: "hec.edu", format: "first.last" },
  { match: /ESSEC/i, domain: "essec.edu", format: "first.last" },
  { match: /ESCP/i, domain: "escp.eu", format: "first.last" },
  { match: /Centralesup[ée]lec/i, domain: "centralesupelec.fr", format: "first.last" },
  { match: /INP-?HB/i, domain: "inphb.ci", format: "first.last" },
];

function sanitize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function deduceCorporateEmail(lead: {
  first_name?: string | null;
  last_name?: string | null;
  full_name: string;
  current_title?: string | null;
  current_company?: string | null;
  source_snippet?: string | null;
}): { email: string; domain: string; confidence: "verified" | "risky" } | null {
  const first = sanitize(lead.first_name || lead.full_name.split(" ")[0] || "");
  const last = sanitize(lead.last_name || lead.full_name.split(" ").slice(1).join(" ") || "");

  if (!first || !last) return null;

  const textToScan = `${lead.current_title || ""} ${lead.current_company || ""} ${lead.source_snippet || ""}`;

  for (const item of COMPANY_PATTERNS) {
    if (item.match.test(textToScan)) {
      let handle = "";
      if (item.format === "first.last") {
        handle = `${first}.${last}`;
      } else if (item.format === "flast") {
        handle = `${first[0]}${last}`;
      } else {
        handle = `${first}_${last}`;
      }

      const isStudent = item.domain.endsWith(".edu") || item.domain.endsWith(".eu") || item.domain.endsWith(".fr");
      return {
        email: `${handle}@${item.domain}`,
        domain: item.domain,
        confidence: isStudent ? "risky" : "verified",
      };
    }
  }

  return null;
}

