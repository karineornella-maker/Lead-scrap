-- Phase 4 : Jobs d'enrichissement email asynchrones (Dropcontact / Hunter)

CREATE TABLE IF NOT EXISTS enrichment_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed')),
    lead_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS enrichment_jobs_status_idx ON enrichment_jobs (status);
CREATE INDEX IF NOT EXISTS enrichment_jobs_campaign_idx ON enrichment_jobs (campaign_id);

ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated access on enrichment_jobs" ON enrichment_jobs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

