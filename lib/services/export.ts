import ExcelJS from "exceljs";
import type { Lead } from "@/lib/types";

export interface ExportLeadRow {
  nom_complet: string;
  prenom: string;
  nom: string;
  titre_actuel: string;
  entreprise: string;
  email: string;
  url_linkedin: string;
  statut_email: string;
  score_uemoa: number | string;
  liens_uemoa: string;
  formation_occidentale: string;
  sujet_ia: string;
  message_ia: string;
  activite_recente: string;
}

export function mapLeadToExportRow(lead: Lead): ExportLeadRow {
  return {
    nom_complet: lead.full_name || "",
    prenom: lead.first_name || "",
    nom: lead.last_name || "",
    titre_actuel: lead.current_title || "",
    entreprise: lead.current_company || "",
    email: lead.business_email || "",
    url_linkedin: lead.linkedin_url || "",
    statut_email: lead.email_status || "",
    score_uemoa: lead.uemoa_affinity_score ?? "",
    liens_uemoa: lead.uemoa_ties || "",
    formation_occidentale: lead.western_education || "",
    sujet_ia: lead.ai_subject || "",
    message_ia: lead.ai_personalized_message || "",
    activite_recente: lead.has_recent_post ? "Actif (Post récent)" : "Standard",
  };
}

function escapeCsvField(val: string | number | undefined | null, delimiter: string = ";"): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Génère un CSV universel (point-virgule) adapté à Excel France
 */
export function generateCsv(leads: Lead[]): string {
  return generateCustomCsv(leads, ";");
}

/**
 * Génère le format CSV exact et officiel documenté par Waalaxy :
 * En-têtes : URL LinkedIn,Email,Email Pro,Prénom,Nom,Poste,Entreprise,Message,Région
 * Délimiteur : Virgule (,)
 * Encodage : UTF-8 avec BOM (\uFEFF)
 * Règle Waalaxy : Seuls les leads avec URL LinkedIn valide sont exportés.
 * Les adresses sont dupliquées dans 'Email' et 'Email Pro' pour garantir
 * la détection automatique quelle que soit la colonne affichée dans Waalaxy.
 */
export function generateWaalaxyCsv(leads: Lead[]): string {
  const headers = [
    "URL LinkedIn",
    "Email",
    "Email Pro",
    "Prénom",
    "Nom",
    "Poste",
    "Entreprise",
    "Message",
    "Région",
  ];

  const rows: string[] = [headers.join(",")];

  for (const lead of leads) {
    // Waalaxy exige formellement une URL LinkedIn valide pour chaque ligne
    const linkedinUrl = lead.linkedin_url ? lead.linkedin_url.trim() : "";
    if (!linkedinUrl) continue;

    const row = mapLeadToExportRow(lead);
    const line = [
      escapeCsvField(row.url_linkedin, ","),
      escapeCsvField(row.email, ","),
      escapeCsvField(row.email, ","),
      escapeCsvField(row.prenom, ","),
      escapeCsvField(row.nom, ","),
      escapeCsvField(row.titre_actuel, ","),
      escapeCsvField(row.entreprise, ","),
      escapeCsvField(row.message_ia, ","),
      escapeCsvField(lead.location || "France", ","),
    ].join(",");
    rows.push(line);
  }

  return `\uFEFF${rows.join("\r\n")}`;
}

export function generateCustomCsv(leads: Lead[], delimiter: string = ";"): string {
  const headers = [
    "Nom complet",
    "Prénom",
    "Nom",
    "Poste",
    "Entreprise",
    "Email",
    "LinkedIn URL",
    "Statut email",
    "Score d'affinité UEMOA",
    "Liens factuels UEMOA",
    "Formation occidentale",
    "Objet email IA",
    "Message",
    "Activité récente LinkedIn",
  ];

  const rows: string[] = [headers.join(delimiter)];

  for (const lead of leads) {
    const row = mapLeadToExportRow(lead);
    const line = [
      escapeCsvField(row.nom_complet, delimiter),
      escapeCsvField(row.prenom, delimiter),
      escapeCsvField(row.nom, delimiter),
      escapeCsvField(row.titre_actuel, delimiter),
      escapeCsvField(row.entreprise, delimiter),
      escapeCsvField(row.email, delimiter),
      escapeCsvField(row.url_linkedin, delimiter),
      escapeCsvField(row.statut_email, delimiter),
      escapeCsvField(row.score_uemoa, delimiter),
      escapeCsvField(row.liens_uemoa, delimiter),
      escapeCsvField(row.formation_occidentale, delimiter),
      escapeCsvField(row.sujet_ia, delimiter),
      escapeCsvField(row.message_ia, delimiter),
      escapeCsvField(row.activite_recente, delimiter),
    ].join(delimiter);
    rows.push(line);
  }

  return `\uFEFF${rows.join("\r\n")}`;
}

/**
 * Génère un classeur XLSX stylisé via ExcelJS :
 * - En-tête en gras avec fond sombre et texte clair
 * - Auto-filtre actif
 * - Largeur de colonnes adaptées
 */
export async function generateXlsx(leads: Lead[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BRVM Lead Scraper & Outreach";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Leads Qualifiés");

  sheet.columns = [
    { header: "Nom complet", key: "nom_complet", width: 22 },
    { header: "Prénom", key: "prenom", width: 14 },
    { header: "Nom", key: "nom", width: 16 },
    { header: "Poste", key: "titre_actuel", width: 28 },
    { header: "Entreprise", key: "entreprise", width: 22 },
    { header: "Email", key: "email", width: 28 },
    { header: "LinkedIn URL", key: "url_linkedin", width: 35 },
    { header: "Statut email", key: "statut_email", width: 14 },
    { header: "Score UEMOA", key: "score_uemoa", width: 14 },
    { header: "Liens factuels UEMOA", key: "liens_uemoa", width: 35 },
    { header: "Formation", key: "formation_occidentale", width: 25 },
    { header: "Objet email IA", key: "sujet_ia", width: 30 },
    { header: "Message", key: "message_ia", width: 45 },
    { header: "Activité récente LinkedIn", key: "activite_recente", width: 24 },
  ];

  // Style de la ligne d'en-tête
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF18181B" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 26;

  // Lignes de données
  for (const lead of leads) {
    sheet.addRow(mapLeadToExportRow(lead));
  }

  // Activer l'autofiltre sur toute la table
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: leads.length + 1, column: 13 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

