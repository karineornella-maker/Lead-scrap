import type { SupabaseClient } from "@supabase/supabase-js";
import { emailStatusLabels } from "@/components/status-badges";
import type { EmailStatus } from "@/lib/types";

export interface LeadFilters {
  campaign: string;
  emailStatus: EmailStatus | "";
  minScore: number;
  school: string;
  keyword: string;
  recentPost: boolean;
}

export type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function parseFilters(sp: SearchParams): LeadFilters {
  const emailStatus = first(sp.email);
  const minScore = Number(first(sp.score));
  const recentPostVal = first(sp.recent_post);
  return {
    campaign: first(sp.campaign),
    emailStatus: emailStatus in emailStatusLabels ? (emailStatus as EmailStatus) : "",
    minScore: Number.isFinite(minScore) ? Math.min(100, Math.max(0, Math.round(minScore))) : 0,
    school: first(sp.school).slice(0, 80),
    keyword: first(sp.q || sp.keyword).slice(0, 100),
    recentPost: recentPostVal === "true" || recentPostVal === "1",
  };
}

export function buildLeadsQuery(
  supabase: SupabaseClient,
  filters: LeadFilters,
  limit = 1000,
) {
  let query = supabase
    .from("leads")
    .select("*")
    .not("full_name", "is", null)
    .order("uemoa_affinity_score", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (filters.campaign) {
    query = query.eq("campaign_id", filters.campaign);
  }
  if (filters.emailStatus) {
    query = query.eq("email_status", filters.emailStatus);
  }
  if (filters.minScore > 0) {
    query = query.gte("uemoa_affinity_score", filters.minScore);
  }
  if (filters.school) {
    const escaped = filters.school.replace(/[\\%_]/g, (c: string) => `\\${c}`);
    query = query.ilike("western_education", `%${escaped}%`);
  }
  if (filters.recentPost) {
    query = query.eq("has_recent_post", true);
  }
  if (filters.keyword) {
    const escaped = filters.keyword.replace(/[\\%_]/g, (c: string) => `\\${c}`);
    query = query.or(
      `full_name.ilike.%${escaped}%,current_title.ilike.%${escaped}%,current_company.ilike.%${escaped}%,uemoa_ties.ilike.%${escaped}%,source_snippet.ilike.%${escaped}%,western_education.ilike.%${escaped}%`,
    );
  }

  return query;
}
