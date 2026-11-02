export interface EnrichmentInputLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  current_company: string | null;
  company_domain?: string | null;
  linkedin_url: string;
}

export interface EnrichmentResult {
  leadId: string;
  email: string | null;
  status: "verified" | "risky" | "not_found";
}

export interface EnrichmentPollResponse {
  completed: boolean;
  results: EnrichmentResult[];
  error?: string;
}

export interface EmailProvider {
  name: string;
  submit(leads: EnrichmentInputLead[]): Promise<string>;
  poll(jobRef: string): Promise<EnrichmentPollResponse>;
}

