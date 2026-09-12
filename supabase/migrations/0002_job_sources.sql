-- ============================================================
-- AVSAR Migration 0002: Job Sources + Dedup Key
-- Run after 0001_init.sql
-- ============================================================

-- Job sources config table — controls which adapters run and with what config
create table if not exists job_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  adapter_type text not null,         -- 'api' | 'scrape'
  config jsonb not null default '{}', -- adapter-specific input config
  enabled boolean default true,
  rate_limit_seconds numeric default 1.0,
  respects_robots_txt boolean default true,
  last_run_at timestamptz,
  last_run_status text,               -- 'ok' | 'error' | null
  created_at timestamptz default now()
);

-- Dedup key on internships — normalized hash of company+title+location
-- collapses near-duplicate postings from different boards into one row
alter table internships add column if not exists dedup_key text;
create index if not exists internships_dedup_idx on internships (dedup_key);

-- Add last_seen_at so we can track when a posting was last returned by a scrape
alter table internships add column if not exists last_seen_at timestamptz default now();
