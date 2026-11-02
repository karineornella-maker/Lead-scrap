-- Phase 3 : Extraction Apify (Google X-Ray) & Liste d'exclusion

-- Colonnes de suivi Apify sur campaigns
ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS apify_run_id TEXT,
    ADD COLUMN IF NOT EXISTS launched_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Justification factuelle du score et traçabilité sur leads
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS source_snippet TEXT,
    ADD COLUMN IF NOT EXISTS source_query TEXT;

-- Table de désinscription / exclusion RGPD (suppression list)
CREATE TABLE IF NOT EXISTS suppression_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    linkedin_url TEXT UNIQUE,
    reason TEXT DEFAULT 'unsubscribe',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS suppression_list_email_idx ON suppression_list (email);
CREATE INDEX IF NOT EXISTS suppression_list_linkedin_url_idx ON suppression_list (linkedin_url);

ALTER TABLE suppression_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated access on suppression_list" ON suppression_list
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

