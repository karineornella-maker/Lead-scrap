import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildLeadsQuery, parseFilters } from "@/lib/leads-query";
import { generateCsv, generateWaalaxyCsv, generateXlsx } from "@/lib/services/export";
import type { Lead } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";

  const rawFilters: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    rawFilters[key] = val;
  });

  const filters = parseFilters(rawFilters);
  const query = buildLeadsQuery(supabase, filters, 5000);

  const [leadsRes, suppressionRes] = await Promise.all([
    query,
    supabase.from("suppression_list").select("email, linkedin_url"),
  ]);

  if (leadsRes.error) {
    return new NextResponse(`Erreur base de données : ${leadsRes.error.message}`, { status: 500 });
  }

  const suppressionRows = suppressionRes.data || [];
  const suppressedEmails = new Set(suppressionRows.map((s) => s.email?.toLowerCase()).filter(Boolean));
  const suppressedUrls = new Set(suppressionRows.map((s) => s.linkedin_url?.toLowerCase()).filter(Boolean));

  const allLeads = (leadsRes.data || []) as Lead[];

  // 1. Filtrage strict de la liste d'exclusion
  // 2. Dédoublonnage par linkedin_url puis par business_email
  const seenUrls = new Set<string>();
  const seenEmails = new Set<string>();
  const cleanLeads: Lead[] = [];

  for (const lead of allLeads) {
    const urlKey = lead.linkedin_url ? lead.linkedin_url.toLowerCase().trim() : "";
    const emailKey = lead.business_email ? lead.business_email.toLowerCase().trim() : "";

    if (urlKey && suppressedUrls.has(urlKey)) continue;
    if (emailKey && suppressedEmails.has(emailKey)) continue;

    if (urlKey) {
      if (seenUrls.has(urlKey)) continue;
      seenUrls.add(urlKey);
    }

    if (emailKey) {
      if (seenEmails.has(emailKey)) continue;
      seenEmails.add(emailKey);
    }

    cleanLeads.push(lead);
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `brvm-leads-${dateStr}`;

  if (format === "xlsx") {
    const buffer = await generateXlsx(cleanLeads);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  if (format === "waalaxy" || format === "csv-waalaxy") {
    const csv = generateWaalaxyCsv(cleanLeads);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}-waalaxy.csv"`,
      },
    });
  }

  const csv = generateCsv(cleanLeads);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}

