# AVSAR → Production Upgrade Plan
**Handoff spec for an AI coding agent (Antigravity) to execute against the `AyushGautam786/AVSAR` repo**

---

## 0. How to use this file

This is a build spec, not a suggestion list. Work through it **phase by phase, in order** — each phase has a "Definition of Done" checklist. Don't start Phase 3 until Phase 1 and 2 are verifiably working. Commit after each phase so the work is reviewable in chunks.

Paste this whole file into Antigravity as the task brief, or feed it one phase at a time if you want tighter control over each PR.

---

## 1. Current state (what actually exists today)

Repo: `frontend/` (React 19 + Vite + TS + Tailwind + `@supabase/supabase-js`) and `backend/` (Flask + scikit-learn).

What's real:
- `ml_recommender.py` — a genuine hybrid recommender: TF-IDF over skills/interests + cosine similarity + a `RandomForestRegressor` trained on **synthetic** compatibility scores (no real user feedback loop yet).
- `frontend/src/lib/supabaseClient.ts` + `useAuth.ts` — Google OAuth via Supabase is already wired on the frontend.
- `useApi.ts` — already writes/reads a `students` table in Supabase for profiles. This part is legit.

What's a demo, not a product:
- `flask_api.py` hardcodes **6 internships and 4 students as Python dicts** in `load_sample_data()`. There is no internships table, no persistence, no real inventory.
- `API_BASE_URL = 'http://localhost:5000'` is hardcoded in `useApi.ts` — nothing can be deployed as-is.
- No applications/bookmarks/interaction tracking, so the ML model can never learn from real behavior — it's stuck training on synthetic targets forever.
- No auth check on the backend — any client can hit any endpoint.
- No tests, no Dockerfile, no CI, no env-based config, no logging, no rate limiting.
- `AnalyticsTab.tsx` almost certainly renders stats computed from the same 6 fake internships.

**The core gap:** this reads as a hackathon judge demo because the data is fake and hand-picked. The single highest-leverage change is replacing the hardcoded dict with a real, continuously refreshed internship inventory — everything else (DB, Apify, deploy) exists to make that possible.

---

## 2. Target architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌───────────────────┐
│  Apify Actor      │      │  Ingestion job         │      │  Supabase (Postgres)│
│  (Internshala      │─────▶│  (Python script,       │─────▶│  internships, students,│
│  scraper)          │ run  │  runs on a schedule)   │upsert│  applications, events, │
└─────────────────┘      └──────────────────────┘      │  recommendations_cache│
                                                          └─────────┬──────────┘
                                                                    │
┌─────────────────┐      ┌──────────────────────┐                 │
│  React frontend    │◀────▶│  Flask API (Render)     │◀────────────────┘
│  (Render Static     │ REST │  - auth check (Supabase │
│   Site)             │      │    JWT)                 │
└─────────────────┘      │  - recommender          │
                          │  - logs interactions     │
                          └──────────────────────┘
```

- **Database + Auth:** Supabase (Postgres, free tier — already half-integrated, keep it).
- **Real internship data:** Apify actor (Internshala scraper — pick one from the Apify Store, e.g. an actor listed under "Internshala Scraper") run on a schedule, output normalized and upserted into Supabase.
- **Backend:** Flask, refactored off hardcoded dicts onto Supabase, deployed on Render.
- **Frontend:** same React app, deployed as a Render Static Site, pointed at the deployed API via env var.
- **Why not put internships in Render's own Postgres:** Supabase free tier already does the job and also carries auth — no reason to pay for a second Postgres. Save the $30 Render credit for compute (web service + cron), not for a DB you already have for free.

---

## 3. Phase 1 — Real database schema (Supabase)

Create these tables in the Supabase SQL editor (or as a migration file `supabase/migrations/0001_init.sql` — prefer this so it's version-controlled).

```sql
-- Companies (normalized out of internships so the same company isn't repeated as a text blob)
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website text,
  source text, -- e.g. 'internshala', 'manual'
  created_at timestamptz default now(),
  unique (name)
);

-- Internships — this replaces the hardcoded dict entirely
create table internships (
  id uuid primary key default gen_random_uuid(),
  external_id text, -- id/URL slug from the source site, for de-duping on re-scrape
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
  is_active boolean default true, -- flip to false instead of deleting when a scrape no longer finds it
  scraped_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (source, external_id)
);
create index on internships (domain);
create index on internships (location);
create index on internships (is_active);

-- Students — extend the existing table (only add columns that don't already exist)
alter table students add column if not exists resume_url text;
alter table students add column if not exists education_level text;
alter table students add column if not exists updated_at timestamptz default now();

-- Applications — a student applying/saving an internship
create table applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) not null,
  internship_id uuid references internships(id) not null,
  status text not null default 'saved', -- saved | applied | interviewing | rejected | offered
  applied_at timestamptz,
  created_at timestamptz default now(),
  unique (student_id, internship_id)
);

-- Interaction events — THIS is what lets the ML model learn from real behavior
-- instead of synthetic targets forever
create table interaction_events (
  id bigint generated always as identity primary key,
  student_id uuid references students(id) not null,
  internship_id uuid references internships(id) not null,
  event_type text not null, -- 'view' | 'click' | 'save' | 'apply' | 'dismiss'
  weight numeric not null default 1.0, -- used as an implicit rating signal
  created_at timestamptz default now()
);
create index on interaction_events (student_id);
create index on interaction_events (internship_id);

-- Row Level Security — students can only touch their own rows
alter table students enable row level security;
alter table applications enable row level security;
alter table interaction_events enable row level security;

create policy "students manage own row" on students
  for all using (auth.uid() = user_id);
create policy "students manage own applications" on applications
  for all using (auth.uid() = (select user_id from students where students.id = applications.student_id));
create policy "students manage own events" on interaction_events
  for all using (auth.uid() = (select user_id from students where students.id = interaction_events.student_id));

-- internships table is public read, backend-only write (service role key bypasses RLS)
alter table internships enable row level security;
create policy "internships public read" on internships for select using (true);
```

**Definition of Done — Phase 1**
- [ ] Migration file committed to the repo (`supabase/migrations/`), not just run ad-hoc in the dashboard.
- [ ] Tables above exist in the Supabase project with RLS on.
- [ ] `.env.example` in both `frontend/` and `backend/` list every Supabase var needed (see §7).

---

## 4. Phase 2 — Real internship data via Apify

**Goal:** replace `load_sample_data()`'s 6 hardcoded internships with hundreds of real, live ones, refreshed on a schedule.

### 4.1 Pick an actor
Search the Apify Store for an "Internshala Scraper" actor (several exist, priced per result, typically pennies per hundred listings). Confirm its output fields (title, company, stipend, location, skills, apply URL, deadline) before wiring the mapper below — field names vary slightly by actor.

### 4.2 Ingestion script — `backend/ingest/run_ingestion.py`
A standalone script (not part of the Flask request path) that:
1. Calls the Apify API to run the actor synchronously (`POST /v2/acts/{actorId}/run-sync-get-dataset-items`) with a JSON input (categories/cities you care about).
2. Maps each raw item to the `internships` schema — normalize stipend to a number, coerce skills into an array, generate a stable `external_id` from the source URL/slug.
3. Upserts into Supabase on `(source, external_id)` so re-running doesn't create duplicates.
4. Marks internships that a full-domain scrape no longer returns as `is_active = false` instead of deleting them (keeps history for analytics).
5. Looks up-or-creates the `companies` row for each listing instead of storing company name as a raw string on `internships` — this is what makes the data model "real" instead of "CSV pretending to be a database."

```python
# backend/ingest/run_ingestion.py — skeleton, fill in the actor-specific field mapping
import os, requests
from supabase import create_client

APIFY_TOKEN = os.environ["APIFY_TOKEN"]
ACTOR_ID = os.environ["APIFY_ACTOR_ID"]  # e.g. "username~internshala-scraper"
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

def run_actor(actor_input: dict) -> list[dict]:
    url = f"https://api.apify.com/v2/acts/{ACTOR_ID}/run-sync-get-dataset-items"
    resp = requests.post(url, params={"token": APIFY_TOKEN}, json=actor_input, timeout=600)
    resp.raise_for_status()
    return resp.json()

def upsert_company(name: str) -> str:
    existing = supabase.table("companies").select("id").eq("name", name).execute()
    if existing.data:
        return existing.data[0]["id"]
    created = supabase.table("companies").insert({"name": name, "source": "internshala"}).execute()
    return created.data[0]["id"]

def map_item(raw: dict) -> dict:
    # NOTE: adjust these keys to match whichever actor you pick — inspect one
    # sample run's dataset in the Apify console before writing this mapping.
    return {
        "external_id": raw.get("url") or raw.get("id"),
        "source": "internshala",
        "role_title": raw.get("title"),
        "domain": raw.get("category"),
        "location": raw.get("location"),
        "is_remote": "work from home" in (raw.get("location", "").lower()),
        "required_skills": raw.get("skills", []),
        "description": raw.get("description"),
        "stipend": parse_stipend(raw.get("stipend")),
        "duration_weeks": parse_duration(raw.get("duration")),
        "application_deadline": raw.get("applyBy"),
        "apply_url": raw.get("url"),
        "is_active": True,
    }

def parse_stipend(raw) -> float | None: ...  # strip "₹", "/month", commas
def parse_duration(raw) -> int | None: ...   # "3 Months" -> 12 weeks etc.

def main():
    items = run_actor({"categories": ["computer-science", "marketing", "design"], "cities": ["all-india"]})
    for raw in items:
        row = map_item(raw)
        row["company_id"] = upsert_company(raw.get("company"))
        supabase.table("internships").upsert(row, on_conflict="source,external_id").execute()
    print(f"Ingested {len(items)} internships")

if __name__ == "__main__":
    main()
```

### 4.3 Scheduling
Run this daily, not in the Flask app's request/response cycle. Two options:
- **Render Cron Job** (~$1/mo minimum) running `python backend/ingest/run_ingestion.py` on a daily schedule — cleanest, keeps everything in one place with the web service.
- **GitHub Actions scheduled workflow** — completely free, good if you want to preserve Render credit for the web service. Trade-off: secrets live in GitHub instead of Render.

Recommendation given the $30 Render credit: use GitHub Actions for the cron job (free) and spend the credit entirely on keeping the backend web service always-on.

**Definition of Done — Phase 2**
- [ ] Running the ingestion script populates real rows in `internships` (verify count > 50, not 6).
- [ ] Re-running it doesn't create duplicates (check row count stays stable, only `scraped_at` changes).
- [ ] Scheduled job is configured (Render Cron or GitHub Actions) and has run at least once unattended.
- [ ] Apify token and Supabase service role key are stored as secrets, never committed.

---

## 5. Phase 3 — Backend refactor (Flask → real data + real auth)

### 5.1 Remove `load_sample_data()` entirely
Replace every `students_df` / `internships_df` read in `flask_api.py` with a Supabase query. The recommender's `train()` and `get_recommendations()` calls can still take DataFrames — just build them from `supabase.table("internships").select("*").eq("is_active", True).execute()` instead of the dict literal.

### 5.2 Auth middleware
Add a decorator that verifies the Supabase JWT sent from the frontend (`Authorization: Bearer <token>`), so `/api/recommendations/*`, `/api/applications`, and interaction-logging endpoints can't be hit anonymously or for another user's data.

```python
from functools import wraps
from flask import request, jsonify
import jwt

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing auth token"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, os.environ["SUPABASE_JWT_SECRET"], algorithms=["HS256"], audience="authenticated")
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        request.user_id = payload["sub"]
        return f(*args, **kwargs)
    return wrapper
```

### 5.3 New endpoints (this is what turns the app from "browse and look" into a product)
- `POST /api/applications` `{internship_id, status}` — save/apply, `require_auth`.
- `GET /api/applications/me` — a student's own application/tracking list.
- `POST /api/events` `{internship_id, event_type}` — log view/click/save/apply as an `interaction_events` row. Fire this from the frontend on card click, apply button, etc.
- `GET /api/internships` — add real pagination (`?page=&page_size=`) and full-text search (`?q=`) now that there can be hundreds of rows, not 6.

### 5.4 Close the ML feedback loop
Right now `generate_synthetic_target()` invents training labels because there's no real feedback. Once `interaction_events` has data:
- Weight events (`view`=0.2, `click`=0.5, `save`=0.7, `apply`=1.0) as the regression target for real (student, internship) pairs.
- Keep the synthetic-data generator as the **cold-start fallback** for students/internships with no interactions yet (this is good practice, not a hack — every real recommender system does this).
- Retrain on a schedule (e.g. nightly, same cron mechanism as ingestion) rather than once at process start — `flask_api.py` currently trains once when the process boots, which means it never learns from new data without a restart.

### 5.5 Production hygiene
- [ ] All config (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `APIFY_TOKEN`, `CORS_ORIGIN`) read from environment variables, never hardcoded.
- [ ] `CORS(app, origins=[os.environ["CORS_ORIGIN"]])` instead of wide-open `CORS(app)`.
- [ ] `Dockerfile` for the backend, or a `render.yaml` blueprint (see §6).
- [ ] Serve with `gunicorn`, not Flask's dev server (`app.run(debug=True)` should never run in production).
- [ ] Basic structured logging (`logging` module) on request errors — right now failures just return a generic 500 JSON with no server-side trace.
- [ ] At least a handful of `pytest` tests: one for the auth decorator rejecting a bad token, one for `/api/internships` pagination, one for the recommender returning results for a known profile.

**Definition of Done — Phase 3**
- [ ] `flask_api.py` has zero references to `load_sample_data`.
- [ ] Hitting `/api/recommendations/<id>` without an auth header returns 401.
- [ ] `pytest` passes locally.
- [ ] App boots with `gunicorn flask_api:app` instead of `python flask_api.py`.

---

## 6. Phase 4 — Frontend wiring

- [ ] `useApi.ts`: replace `const API_BASE_URL = 'http://localhost:5000'` with `const API_BASE_URL = import.meta.env.VITE_API_URL`, and add `VITE_API_URL` to `.env.example`.
- [ ] Every `fetch()` call that hits a `require_auth` endpoint must attach `Authorization: Bearer ${session.access_token}` — pull the token from `supabase.auth.getSession()`.
- [ ] `InternshipCard.tsx` / `RecommendationCard.tsx`: fire a `POST /api/events` (`event_type: 'view'` on render via intersection observer, `'click'` on apply button) — this is what feeds Phase 3.4's feedback loop, so skipping this means the ML model can never actually improve.
- [ ] Add an "Applied" / "Save for later" button wired to `POST /api/applications`.
- [ ] Add a simple "My Applications" view reading `GET /api/applications/me`, so `AnalyticsTab.tsx` has something real to summarize besides the 6 fake internships.
- [ ] Add pagination or infinite scroll to `InternshipsTab.tsx` now that there are hundreds of rows instead of 6.
- [ ] Loading and empty states everywhere a fetch happens — right now a slow/failed request likely just shows nothing.

**Definition of Done — Phase 4**
- [ ] `npm run build` succeeds with no hardcoded `localhost` left anywhere (`grep -r localhost frontend/src` returns nothing).
- [ ] A manual click-through: sign in → see real internships → save one → see it in "My Applications."

---

## 7. Phase 5 — Deployment (Render)

You have $30 in Render credit. Spend plan:

| Service | Plan | Cost | Why |
|---|---|---|---|
| Frontend | Static Site | Free | Static sites are free on Render regardless of plan — no reason to pay here. |
| Backend (Flask API) | Web Service, Starter | $7/mo | Free web services spin down after 15 min idle with ~1 min cold start — bad for a demo you're sending links to. Starter keeps it always-on. |
| Ingestion cron | GitHub Actions (free) *or* Render Cron | $0 or $1/mo | See §4.3 — prefer GitHub Actions to save credit unless you want everything in one dashboard. |
| Database + Auth | Supabase free tier | $0 | Already covers this project's scale (500MB DB, 50k monthly active users). |

At $7–8/mo total, $30 credit covers **~4 months** of always-on hosting — enough to demo, interview, and iterate. Revisit before it runs out.

### 7.1 `render.yaml` (Infrastructure as Code — commit this to the repo root)
```yaml
services:
  - type: web
    name: avsar-api
    runtime: python
    plan: starter
    buildCommand: pip install -r backend/requirements.txt
    startCommand: gunicorn --chdir backend flask_api:app
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: SUPABASE_JWT_SECRET
        sync: false
      - key: CORS_ORIGIN
        sync: false

  - type: web
    name: avsar-frontend
    runtime: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
    envVars:
      - key: VITE_API_URL
        sync: false
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_KEY
        sync: false
```
(`sync: false` means you paste the actual secret values into the Render dashboard rather than committing them — do not put real keys in this file.)

### 7.2 Environment variable reference

| Var | Where | Value source |
|---|---|---|
| `SUPABASE_URL` | backend + frontend | Supabase project settings |
| `SUPABASE_KEY` (anon/public) | frontend | Supabase project settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | backend only, never frontend | Supabase project settings → API (secret!) |
| `SUPABASE_JWT_SECRET` | backend only | Supabase project settings → API |
| `APIFY_TOKEN` | ingestion script/cron only | Apify console → Integrations |
| `APIFY_ACTOR_ID` | ingestion script/cron only | The actor's `username~actor-name` slug |
| `VITE_API_URL` | frontend | The deployed Render backend URL |
| `CORS_ORIGIN` | backend | The deployed Render frontend URL |

**Definition of Done — Phase 5**
- [ ] Backend and frontend both live at Render URLs, not localhost.
- [ ] Frontend deployed build talks to the deployed backend (not localhost) — verify in browser network tab.
- [ ] Cron job has produced at least one successful run against the production database.
- [ ] No secret values appear in the git history — check with `git log -p | grep -i "SUPABASE\|APIFY"` before pushing.

---

## 8. Phase 6 — Making it read as a real product, not a SIH demo

These are the details that separate "student project" from "someone would actually trust this":

- [ ] **README rewrite**: architecture diagram, setup instructions, live demo link, screenshot/GIF of the recommendation flow. This is usually the first thing anyone (recruiter, judge, user) actually reads.
- [ ] **Empty/error states**: what does the UI show when the recommender has zero results, when the API is down, when a scrape hasn't run yet? Right now these paths are probably unhandled.
- [ ] **Rate limiting** on `/api/recommendations/custom` (e.g. `flask-limiter`) so it can't be hammered.
- [ ] **Input validation** on the custom-profile endpoint — currently only checks presence, not shape (e.g. a string where a list is expected will 500).
- [ ] **Explainability**: show *why* an internship was recommended (e.g. "Matches 4/5 of your skills: Python, SQL..."). This is cheap to add from the TF-IDF overlap and makes the ML feel real instead of a black box — judges and users both respond to this.
- [ ] **Basic CI**: a GitHub Actions workflow that runs `pytest` (backend) and `npm run build` (frontend) on every PR, so broken code can't reach `main`.
- [ ] **Terms note**: since internship data is scraped, add a one-line footer/about note that listings are sourced from public postings and link back to the original apply URL rather than hosting the full application flow yourself — keeps you honest about not disintermediating the source.

**Definition of Done — Phase 6**
- [ ] README has a live URL a stranger can click and use.
- [ ] CI is green on the default branch.
- [ ] A cold demo run-through (no prior context) makes sense end to end without the person asking "wait, is this data real?"

---

## 9. Suggested execution order for Antigravity

1. Phase 1 (schema) — nothing else can be tested without this.
2. Phase 2 (ingestion) — get real data flowing before touching the API that serves it.
3. Phase 3 (backend refactor) — now point the API at real data + add auth.
4. Phase 4 (frontend wiring) — connect the UI to the real API.
5. Phase 5 (deploy) — ship it.
6. Phase 6 (polish) — do this last, iteratively, once the core loop works end to end.

Treat each numbered phase as its own PR/commit so it's reviewable and revertible independently.
