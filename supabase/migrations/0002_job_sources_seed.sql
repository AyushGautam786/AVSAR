-- Seed data for job_sources table
-- Run after 0002_job_sources.sql and adjust company lists to your target audience.

insert into job_sources (name, adapter_type, config, rate_limit_seconds, respects_robots_txt) values
  (
    'greenhouse',
    'api',
    '{
      "companies": ["stripe", "notion", "airtable", "figma", "vercel", "linear"]
    }',
    0.5,
    true
  ),
  (
    'lever',
    'api',
    '{
      "companies": ["netflix", "attentive", "mercury", "rippling", "brex"]
    }',
    0.5,
    true
  ),
  (
    'adzuna',
    'api',
    '{
      "query": "internship",
      "country": "in",
      "results_per_page": 50
    }',
    1.0,
    true
  ),
  (
    'internshala',
    'scrape',
    '{
      "categories": ["computer-science", "web-development", "data-science", "machine-learning", "marketing", "design"],
      "cities": ["all-india"],
      "maxItems": 500
    }',
    2.0,
    true  -- verify against internshala.com/robots.txt before enabling in production
  )
on conflict (name) do update
  set config = excluded.config,
      adapter_type = excluded.adapter_type;
