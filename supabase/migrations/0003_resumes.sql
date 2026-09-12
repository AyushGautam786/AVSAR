-- ============================================================
-- AVSAR Migration 0003: AI Resume Tailoring Tables
-- Run after 0002_job_sources.sql
-- ============================================================

create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) not null,
  original_filename text,
  storage_path text not null,  -- Supabase Storage private bucket path
  parsed_text text,
  parsed_sections jsonb,       -- {experience: [...], education: [...], skills: [...]}
  created_at timestamptz default now()
);

create table if not exists job_descriptions (
  id uuid primary key default gen_random_uuid(),
  internship_id uuid references internships(id), -- nullable: user may paste external JD
  raw_text text not null,
  parsed_keywords text[],
  created_at timestamptz default now()
);

create table if not exists resume_tailoring_requests (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes(id) not null,
  job_description_id uuid references job_descriptions(id) not null,
  ats_score_before numeric,
  ats_score_after numeric,
  tailored_storage_path text,
  diff jsonb,          -- per-bullet before/after, for diff review UI
  fabrication_flags text[] default '{}',  -- new entities flagged by guard
  status text default 'pending',          -- pending | processing | done | failed
  error_message text,
  created_at timestamptz default now()
);

-- Row Level Security
alter table resumes enable row level security;
alter table resume_tailoring_requests enable row level security;

create policy "own resumes" on resumes
  for all using (
    auth.uid() = (select user_id from students where students.id = resumes.student_id)
  );

create policy "own tailoring requests" on resume_tailoring_requests
  for all using (
    auth.uid() = (
      select s.user_id from students s
      join resumes r on r.student_id = s.id
      where r.id = resume_tailoring_requests.resume_id
    )
  );

-- NOTE: Create a private Supabase Storage bucket named "resumes" in the dashboard.
-- It must NOT be public. Download links must use signed URLs with an expiry.
