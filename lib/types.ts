// Miroir des migrations Supabase 0001_init.sql à 0004_outreach.sql

export type CampaignStatus = "draft" | "running" | "completed";
export type GroupMode = "standalone" | "cross_filter";
export type EmailStatus = "verified" | "risky" | "not_found" | "pending";
export type EnrichmentJobStatus = "pending" | "completed" | "failed";

export interface Campaign {
  id: string;
  name: string;
  target_region: string | null;
  target_country: string;
  target_countries?: string[];
  target_universities: string[];
  target_roles: string[];
  target_groups: string[];
  group_mode: GroupMode;
  batch_size: number;
  status: CampaignStatus;
  created_by: string | null;
  created_at: string;
  apify_run_id?: string | null;
  launched_at?: string | null;
  last_error?: string | null;
}

export interface Lead {
  id: string;
  campaign_id: string | null;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  current_title: string | null;
  current_company: string | null;
  company_domain: string | null;
  location: string | null;
  linkedin_url: string;
  western_education: string | null;
  uemoa_ties: string | null;
  uemoa_affinity_score: number | null;
  business_email: string | null;
  email_status: EmailStatus;
  ai_personalized_message: string | null;
  ai_subject?: string | null;
  source_snippet?: string | null;
  source_query?: string | null;
  has_recent_post?: boolean | null;
  recent_post_snippet?: string | null;
  email?: string | null;
  raw?: Record<string, unknown> | null;
  created_at: string;
}

export interface SuppressionEntry {
  id: string;
  email: string | null;
  linkedin_url: string | null;
  reason: string | null;
  created_at: string;
}

export interface EnrichmentJob {
  id: string;
  campaign_id: string;
  provider: string;
  external_id: string;
  status: EnrichmentJobStatus;
  lead_ids: string[];
  created_at: string;
}

// data/universities.json
export interface University {
  id: string;
  name: string;
  aliases: string[];
}

export interface UniversityGroup {
  id: string;
  label: string;
  universities: University[];
}

export interface Country {
  code: string;
  name: string;
  allLabel?: string;
  groups: UniversityGroup[];
}

export interface Region {
  id: string;
  label: string;
  countries: Country[];
}

// data/affinity-groups.json
export interface AffinityGroup {
  id: string;
  name: string;
  scope: string;
  keywords: string[];
}

export interface AffinityCategory {
  id: string;
  label: string;
  groups: AffinityGroup[];
}
