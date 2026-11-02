-- Phase 1 : schéma initial (campagnes + leads)

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    target_region TEXT,
    target_country TEXT NOT NULL,
    target_universities TEXT[] NOT NULL DEFAULT '{}',
    target_roles TEXT[] NOT NULL DEFAULT '{}',
    target_groups TEXT[] NOT NULL DEFAULT '{}',          -- ids de data/affinity-groups.json
    group_mode TEXT NOT NULL DEFAULT 'cross_filter'
        CHECK (group_mode IN ('standalone', 'cross_filter')),
    batch_size INT NOT NULL DEFAULT 100 CHECK (batch_size BETWEEN 1 AND 5000),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'running', 'completed')),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    current_title TEXT,
    current_company TEXT,
    company_domain TEXT,
    location TEXT,
    linkedin_url TEXT UNIQUE NOT NULL,
    western_education TEXT,
    -- Liens factuels pro/académiques avec la zone UEMOA (ex : "Ingénieur INP-HB, 3 ans chez Orange CI").
    -- Ne jamais y stocker d'origine ethnique ou nationale supposée (RGPD art. 9).
    uemoa_ties TEXT,
    uemoa_affinity_score INT CHECK (uemoa_affinity_score BETWEEN 0 AND 100),
    business_email TEXT,
    email_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (email_status IN ('verified', 'risky', 'not_found', 'pending')),
    ai_personalized_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX leads_campaign_id_idx ON leads (campaign_id);
CREATE INDEX leads_email_status_idx ON leads (email_status);
CREATE INDEX leads_score_idx ON leads (uemoa_affinity_score DESC);

-- RLS : seuls les utilisateurs authentifiés de l'équipe accèdent aux données.
-- Les jobs serveur (Apify, enrichissement) passent par la service_role key, qui contourne RLS.
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access" ON campaigns
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON leads
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
