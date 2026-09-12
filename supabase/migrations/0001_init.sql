-- ============================================================
-- AVSAR — Supabase Migration 0001: Initial Schema
-- Run in Supabase SQL Editor or apply via supabase CLI:
--   supabase db push
-- ============================================================

-- Companies (normalized out of internships)
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website text,
  source text default 'internshala',
  created_at timestamptz default now(),
  unique (name)
);

-- Internships — replaces the hardcoded dict entirely
create table if not exists internships (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source text not null default 'internshala',
  company_id uuid references companies(id),
  role_title text not null,
  domain text,
  location text,
  is_remote boolean default false,
  required_skills text[] default '{}',
  description text,
  duration_weeks int,
  stipend numeric,
  stipend_currency text default 'INR',
  start_date date,
  application_deadline date,
  apply_url text,
  is_active boolean default true,
  scraped_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (source, external_id)
);

create index if not exists internships_domain_idx on internships (domain);
create index if not exists internships_location_idx on internships (location);
create index if not exists internships_is_active_idx on internships (is_active);

-- Students — extend existing table
alter table students add column if not exists resume_url text;
alter table students add column if not exists education_level text;
alter table students add column if not exists updated_at timestamptz default now();

-- Applications
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) not null,
  internship_id uuid references internships(id) not null,
  status text not null default 'saved', -- saved | applied | interviewing | rejected | offered
  applied_at timestamptz,
  created_at timestamptz default now(),
  unique (student_id, internship_id)
);

-- Interaction events — feeds the ML feedback loop
create table if not exists interaction_events (
  id bigint generated always as identity primary key,
  student_id uuid references students(id) not null,
  internship_id uuid references internships(id) not null,
  event_type text not null, -- 'view' | 'click' | 'save' | 'apply' | 'dismiss'
  weight numeric not null default 1.0,
  created_at timestamptz default now()
);

create index if not exists interaction_events_student_idx on interaction_events (student_id);
create index if not exists interaction_events_internship_idx on interaction_events (internship_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table students enable row level security;
alter table applications enable row level security;
alter table interaction_events enable row level security;
alter table internships enable row level security;

-- Students can only manage their own row
create policy "students manage own row" on students
  for all using (auth.uid() = user_id);

-- Students can only manage their own applications
create policy "students manage own applications" on applications
  for all using (
    auth.uid() = (select user_id from students where students.id = applications.student_id)
  );

-- Students can only manage their own interaction events
create policy "students manage own events" on interaction_events
  for all using (
    auth.uid() = (select user_id from students where students.id = interaction_events.student_id)
  );

-- Internships: public read, backend-only write (service role key bypasses RLS)
create policy "internships public read" on internships for select using (true);
