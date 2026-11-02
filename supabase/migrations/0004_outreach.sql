-- Phase 5 : Accroches IA (sujet personnalisé)

ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS ai_subject TEXT;

