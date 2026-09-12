# AVSAR — Multi-Source Sourcing, Advanced ML & AI Resume Tailoring
**Addendum handoff spec for Antigravity — builds on `AVSAR_UPGRADE_PLAN.md`**

---

## 0. How this relates to the first plan

This replaces **Phase 2** of the original plan (which was Apify-only) with a legally-tiered, multi-source ingestion system, and adds two new phases:

- **Phase 2 (revised):** multi-source job ingestion, API-first, scraping only where no API exists.
- **Phase 7:** upgraded ML recommender (embeddings + real interaction training).
- **Phase 8:** AI resume tailoring (ATS optimization against a target job description).
- **Phase 9:** legal/compliance checklist — read this before shipping any of the above.

Do Phase 1 (schema) from the original doc first — everything below assumes those tables exist. Execute in numeric order; each phase has its own Definition of Done.

---

## 1. Phase 2 (REVISED) — Legal, multi-source ingestion

### 1.1 Principle
No single scraper covers every job board, and treating this as "just point Apify at everything" creates unnecessary legal exposure (LinkedIn in particular has litigated scraping aggressively). Build an **adapter pattern**: one small module per source, all normalizing into the same `internships` schema. Rank sources by risk and lean on the free, legal ones first.

| Tier | Source | Method | Risk |
|---|---|---|---|
| 1 | Greenhouse | Public JSON API, no auth | None — official, built for this |
| 1 | Lever | Public JSON API, no auth | None — official, built for this |
| 1 | Adzuna / Jooble | Official partner API (free tier + key) | None — licensed use |
| 1 | RemoteOK / Arbeitnow | Open public JSON feeds | Low — check their terms, generally aggregator-friendly |
| 2 | Internshala | Apify actor or light custom scraper | Moderate — public pages, no login, respect robots.txt + rate limit |
| Out of scope | LinkedIn, Naukri aggressive scraping | — | High — explicit ToS bans, active litigation history (*hiQ v. LinkedIn*). Skip unless you get an official partner API. |

### 1.2 Schema addition — `job_sources` config table

```sql
create table job_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,        -- 'greenhouse', 'lever', 'adzuna', 'internshala'
  adapter_type text not null,       -- 'api' | 'scrape'
  config jsonb not null default '{}', -- e.g. {"companies": ["stripe","airbnb"]} or {"categories": [...]}
  enabled boolean default true,
  rate_limit_seconds numeric default 1.0,
  respects_robots_txt boolean default true,
  last_run_at timestamptz,
  last_run_status text,
  created_at timestamptz default now()
);

-- dedup support: same posting often appears on multiple boards
alter table internships add column if not exists dedup_key text;
create index if not exists internships_dedup_idx on internships (dedup_key);
```

`dedup_key` = a normalized hash of `lower(company_name) + lower(role_title) + lower(location)`, stripped of whitespace/punctuation — computed at ingestion time so near-duplicate postings from different sources collapse into one row (keep the first-seen `source`, update `last_seen_at`).

### 1.3 Adapter interface — `backend/ingest/adapters/base.py`

```python
from abc import ABC, abstractmethod

class JobSourceAdapter(ABC):
    source_name: str

    @abstractmethod
    def fetch(self, config: dict) -> list[dict]:
        """Return raw items from this source. No normalization here."""

    @abstractmethod
    def normalize(self, raw: dict) -> dict:
        """Map one raw item to the internships table schema."""
```

### 1.4 Tier 1 adapters — official APIs, build these first

```python
# backend/ingest/adapters/greenhouse.py
import requests
from .base import JobSourceAdapter

class GreenhouseAdapter(JobSourceAdapter):
    source_name = "greenhouse"

    def fetch(self, config: dict) -> list[dict]:
        items = []
        for company_token in config["companies"]:  # e.g. ["stripe", "notion"]
            url = f"https://boards-api.greenhouse.io/v1/boards/{company_token}/jobs"
            resp = requests.get(url, timeout=30)
            if resp.ok:
                for job in resp.json().get("jobs", []):
                    job["_company_token"] = company_token
                    items.append(job)
        return items

    def normalize(self, raw: dict) -> dict:
        return {
            "external_id": str(raw["id"]),
            "source": self.source_name,
            "role_title": raw["title"],
            "location": raw.get("location", {}).get("name"),
            "apply_url": raw.get("absolute_url"),
            "description": raw.get("content"),  # HTML — strip tags before storing
            "company_name": raw["_company_token"],
        }
```

```python
# backend/ingest/adapters/lever.py
import requests
from .base import JobSourceAdapter

class LeverAdapter(JobSourceAdapter):
    source_name = "lever"

    def fetch(self, config: dict) -> list[dict]:
        items = []
        for company in config["companies"]:
            url = f"https://api.lever.co/v0/postings/{company}?mode=json"
            resp = requests.get(url, timeout=30)
            if resp.ok:
                for job in resp.json():
                    job["_company"] = company
                    items.append(job)
        return items

    def normalize(self, raw: dict) -> dict:
        return {
            "external_id": raw["id"],
            "source": self.source_name,
            "role_title": raw["text"],
            "location": raw.get("categories", {}).get("location"),
            "apply_url": raw.get("hostedUrl"),
            "description": raw.get("descriptionPlain"),
            "company_name": raw["_company"],
        }
```

```python
# backend/ingest/adapters/adzuna.py
import os, requests
from .base import JobSourceAdapter

class AdzunaAdapter(JobSourceAdapter):
    source_name = "adzuna"

    def fetch(self, config: dict) -> list[dict]:
        app_id, app_key = os.environ["ADZUNA_APP_ID"], os.environ["ADZUNA_APP_KEY"]
        country = config.get("country", "in")
        url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
        resp = requests.get(url, params={
            "app_id": app_id, "app_key": app_key,
            "results_per_page": 50, "what": config.get("query", "internship"),
        }, timeout=30)
        return resp.json().get("results", []) if resp.ok else []

    def normalize(self, raw: dict) -> dict:
        return {
            "external_id": raw["id"],
            "source": self.source_name,
            "role_title": raw["title"],
            "location": raw.get("location", {}).get("display_name"),
            "apply_url": raw.get("redirect_url"),
            "description": raw.get("description"),
            "company_name": raw.get("company", {}).get("display_name"),
            "stipend": raw.get("salary_min"),
        }
```

Sign up for free API keys: `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` at Adzuna's developer portal. Greenhouse and Lever need no key at all — just a list of company tokens (found in the company's careers page URL, e.g. `boards.greenhouse.io/{token}`).

### 1.5 Tier 2 adapter — Internshala, rate-limited and robots.txt-respecting

```python
# backend/ingest/adapters/internshala.py
import os, requests, time
from .base import JobSourceAdapter

class InternshalaApifyAdapter(JobSourceAdapter):
    source_name = "internshala"

    def fetch(self, config: dict) -> list[dict]:
        token = os.environ["APIFY_TOKEN"]
        actor_id = os.environ["APIFY_ACTOR_ID"]
        url = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"
        resp = requests.post(url, params={"token": token}, json=config, timeout=600)
        resp.raise_for_status()
        return resp.json()

    def normalize(self, raw: dict) -> dict:
        return {
            "external_id": raw.get("url") or raw.get("id"),
            "source": self.source_name,
            "role_title": raw.get("title"),
            "domain": raw.get("category"),
            "location": raw.get("location"),
            "is_remote": "work from home" in (raw.get("location", "") or "").lower(),
            "required_skills": raw.get("skills", []),
            "description": raw.get("description"),
            "stipend": raw.get("stipend"),
            "apply_url": raw.get("url"),
            "company_name": raw.get("company"),
        }
```

The Apify actor itself already handles pagination and rate limiting responsibly (this is delegated to the actor's own crawler config, which you should leave at conservative defaults — don't crank concurrency to "scrape faster").

### 1.6 Orchestrator — `backend/ingest/run_ingestion.py`

```python
import hashlib, re
from supabase import create_client
from adapters.greenhouse import GreenhouseAdapter
from adapters.lever import LeverAdapter
from adapters.adzuna import AdzunaAdapter
from adapters.internshala import InternshalaApifyAdapter

ADAPTERS = {
    "greenhouse": GreenhouseAdapter(),
    "lever": LeverAdapter(),
    "adzuna": AdzunaAdapter(),
    "internshala": InternshalaApifyAdapter(),
}

def dedup_key(company: str, title: str, location: str) -> str:
    raw = re.sub(r"[^a-z0-9]", "", f"{company}{title}{location}".lower())
    return hashlib.sha256(raw.encode()).hexdigest()

def upsert_company(supabase, name: str) -> str:
    existing = supabase.table("companies").select("id").eq("name", name).execute()
    if existing.data:
        return existing.data[0]["id"]
    return supabase.table("companies").insert({"name": name}).execute().data[0]["id"]

def run():
    supabase = create_client(...)  # from env, service role key
    sources = supabase.table("job_sources").select("*").eq("enabled", True).execute().data

    for source_row in sources:
        adapter = ADAPTERS.get(source_row["name"])
        if not adapter:
            continue
        raw_items = adapter.fetch(source_row["config"])
        for raw in raw_items:
            normalized = adapter.normalize(raw)
            company_id = upsert_company(supabase, normalized.pop("company_name", "Unknown"))
            normalized["company_id"] = company_id
            normalized["dedup_key"] = dedup_key(
                str(company_id), normalized.get("role_title", ""), normalized.get("location", "")
            )
            supabase.table("internships").upsert(
                normalized, on_conflict="source,external_id"
            ).execute()
        supabase.table("job_sources").update({"last_run_status": "ok"}).eq("id", source_row["id"]).execute()

if __name__ == "__main__":
    run()
```

Seed `job_sources` with your starting config, e.g.:
```sql
insert into job_sources (name, adapter_type, config) values
  ('greenhouse', 'api', '{"companies": ["stripe","notion","airtable"]}'),
  ('lever', 'api', '{"companies": ["netflix","attentive"]}'),
  ('adzuna', 'api', '{"query": "internship", "country": "in"}'),
  ('internshala', 'scrape', '{"categories": ["computer-science","marketing"], "cities": ["all-india"]}');
```

**Definition of Done — Phase 2 (revised)**
- [ ] All four adapters run successfully and populate `internships` with `source` values matching each adapter.
- [ ] Re-running twice does not create duplicate rows for the same posting (check via `dedup_key` collisions collapsing to one row, and `(source, external_id)` uniqueness).
- [ ] `job_sources.respects_robots_txt` is true for the Internshala config, and you've actually checked `internshala.com/robots.txt` yourself, not just trusted the flag.
- [ ] No credentials for any source are committed to git.

---

## 2. Phase 7 — Advanced ML recommender

Builds on the existing `MLInternshipRecommender`. Only do this once `interaction_events` (from Phase 3.4 of the original plan) has real data — there's nothing to upgrade if there's no real signal yet.

### 2.1 Semantic matching instead of pure keyword TF-IDF
Swap `TfidfVectorizer` for sentence embeddings so "React" can match "frontend framework experience" instead of requiring exact keyword overlap:

```python
from sentence_transformers import SentenceTransformer
import numpy as np

embedder = SentenceTransformer("all-MiniLM-L6-v2")  # small, fast, free, runs on CPU

def embed_text(text: str) -> np.ndarray:
    return embedder.encode(text, normalize_embeddings=True)

def semantic_similarity(student_text: str, internship_text: str) -> float:
    a, b = embed_text(student_text), embed_text(internship_text)
    return float(np.dot(a, b))  # cosine similarity, since both are normalized
```

Keep TF-IDF as a secondary signal (exact skill-name matches are still a strong, cheap feature) and blend both into the feature vector already going into the `RandomForestRegressor`.

### 2.2 Real training target, cold-start fallback preserved
```python
def build_target(student_id, internship_id, interaction_events_df):
    events = interaction_events_df[
        (interaction_events_df.student_id == student_id) &
        (interaction_events_df.internship_id == internship_id)
    ]
    if events.empty:
        return None  # fall back to generate_synthetic_target() — keep this function, it's the correct cold-start behavior
    weights = {"view": 0.2, "click": 0.5, "save": 0.7, "apply": 1.0, "dismiss": -0.5}
    return max(weights.get(e, 0) for e in events.event_type)
```

### 2.3 Retrain on a schedule, not once at boot
Move training out of the Flask process startup into the same nightly cron mechanism as ingestion (Phase 2/§4.3 of the original doc) — write the trained model to Supabase Storage or a Render persistent disk, and have the Flask app load the latest artifact on boot instead of retraining every deploy.

### 2.4 Explainability stays mandatory
Every recommendation response should include which skills matched and which are missing:
```python
def explain_match(student_skills: list[str], internship_skills: list[str]) -> dict:
    matched = set(s.lower() for s in student_skills) & set(s.lower() for s in internship_skills)
    missing = set(s.lower() for s in internship_skills) - matched
    return {"matched_skills": sorted(matched), "missing_skills": sorted(missing)}
```

**Definition of Done — Phase 7**
- [ ] Recommendations blend semantic + keyword signal, verified by a manual test case where a synonym match (e.g. "ML" vs "Machine Learning") scores meaningfully higher than before.
- [ ] Model retrains on schedule and the API loads the latest artifact without a redeploy.
- [ ] Every recommendation in the API response includes `matched_skills` / `missing_skills`.

---

## 3. Phase 8 — AI Resume Tailoring (ATS-optimized, against a target job description)

### 3.1 Hard rule, non-negotiable
**The rewrite step may only rephrase and re-emphasize experience the user actually has. It must never invent skills, employers, dates, or achievements.** This isn't just an ethics point — a fabricated resume that gets a human interview and falls apart is worse for the user than no tailoring at all, and it's the single fastest way to make this feature actively harmful. Bake this into the LLM prompt as a hard constraint, not a suggestion, and validate the model's output doesn't introduce new named entities (companies, tools, numbers) absent from the original resume.

### 3.2 Schema

```sql
create table resumes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) not null,
  original_filename text,
  storage_path text not null,   -- Supabase Storage bucket path
  parsed_text text,
  parsed_sections jsonb,        -- {experience: [...], education: [...], skills: [...]}
  created_at timestamptz default now()
);

create table job_descriptions (
  id uuid primary key default gen_random_uuid(),
  internship_id uuid references internships(id), -- nullable: user may paste an external JD
  raw_text text not null,
  parsed_keywords text[],
  created_at timestamptz default now()
);

create table resume_tailoring_requests (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes(id) not null,
  job_description_id uuid references job_descriptions(id) not null,
  ats_score_before numeric,
  ats_score_after numeric,
  tailored_storage_path text,
  diff jsonb,          -- per-bullet before/after, for a review UI
  status text default 'pending', -- pending | done | failed
  created_at timestamptz default now()
);

alter table resumes enable row level security;
alter table resume_tailoring_requests enable row level security;
create policy "own resumes" on resumes for all using (auth.uid() = (select user_id from students where students.id = resumes.student_id));
```

Create a private Supabase Storage bucket (`resumes`) — not public — since resumes are sensitive personal data. Generate short-lived signed URLs for download, never permanent public links.

### 3.3 Pipeline — `backend/resume_tailor/pipeline.py`

```python
# Parsing: extract raw text + rough section split from an uploaded docx/pdf
import docx, pdfplumber

def extract_text(file_path: str) -> str:
    if file_path.endswith(".docx"):
        doc = docx.Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs)
    elif file_path.endswith(".pdf"):
        with pdfplumber.open(file_path) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    raise ValueError("Unsupported file type — accept .docx and .pdf only")

def parse_jd_keywords(jd_text: str) -> list[str]:
    # Cheapest correct approach: ask the LLM for a structured keyword list —
    # more reliable than a hand-rolled noun-phrase extractor for messy real JDs.
    ...

def ats_score(resume_text: str, jd_keywords: list[str]) -> float:
    text_lower = resume_text.lower()
    hits = sum(1 for kw in jd_keywords if kw.lower() in text_lower)
    return round(100 * hits / max(len(jd_keywords), 1), 1)

def rewrite_bullets(resume_sections: dict, jd_keywords: list[str]) -> dict:
    """
    Calls the LLM once per resume with a hard constraint prompt:
    - Rephrase existing bullets to surface relevant, ALREADY-PRESENT experience
      using the JD's terminology where truthfully applicable.
    - Never add a skill, tool, employer, metric, or achievement not present
      in the original text.
    - Return the same number of bullets, same underlying facts, improved wording.
    """
    ...

def render_docx(rewritten_sections: dict, output_path: str):
    # Single-column, no tables/text-boxes/headers-footers/images —
    # these are the layout features that break ATS parsers.
    doc = docx.Document()
    for section_name, bullets in rewritten_sections.items():
        doc.add_heading(section_name.title(), level=2)
        for bullet in bullets:
            doc.add_paragraph(bullet, style="List Bullet")
    doc.save(output_path)
```

### 3.4 Fabrication guard
After the LLM rewrite, before accepting the output:
```python
def check_no_fabrication(original_text: str, rewritten_text: str) -> list[str]:
    """Flag any capitalized multi-word phrases (likely tool/company/skill names)
    that appear in the rewrite but not in the original, for human review."""
    import re
    orig_entities = set(re.findall(r"\b[A-Z][a-zA-Z0-9+.]{2,}\b", original_text))
    new_entities = set(re.findall(r"\b[A-Z][a-zA-Z0-9+.]{2,}\b", rewritten_text))
    return sorted(new_entities - orig_entities)
```
If this returns anything, surface it in the UI as "these terms are new — please confirm you actually have this experience before we include it" rather than silently accepting the rewrite.

### 3.5 Endpoints
- `POST /api/resume/upload` — multipart upload, stores to Supabase Storage, parses, saves `resumes` row.
- `POST /api/resume/tailor` `{resume_id, job_description_text}` — runs the pipeline, returns `ats_score_before`, `ats_score_after`, `diff`, and a signed download URL for the tailored `.docx`.
- `GET /api/resume/tailor/{id}` — poll status for long-running requests.

### 3.6 Frontend — `ResumeTailorPage.tsx`
- Upload resume (drag-drop, accept `.docx`/`.pdf`).
- Paste or select a target JD (auto-fill from an `internships` row if tailoring against a listing already in the system).
- Show before/after ATS score side by side, and a per-bullet diff view so the user can see exactly what changed and approve/reject the fabrication-guard flags.
- Download button for the final `.docx`.

**Definition of Done — Phase 8**
- [ ] Uploading a real resume + a real JD produces a tailored `.docx` that opens cleanly in Word.
- [ ] `ats_score_after` is measurably higher than `ats_score_before` on a test case.
- [ ] The fabrication guard actually fires on a deliberately bad test (rewrite that adds a skill not in the original) and blocks silent acceptance.
- [ ] Resumes are stored in a private bucket; a signed URL expires (test that an old link 403s).

---

## 4. Phase 9 — Legal/compliance checklist

Do this before Phase 2 goes live in production, not after:

- [ ] Read `robots.txt` for every scraped (non-API) source and confirm the paths you're hitting aren't disallowed.
- [ ] Read the Terms of Service for every scraped source; if scraping is explicitly prohibited, drop that source or get a partnership/API key instead.
- [ ] Confirm you're only ever fetching publicly-visible pages — nothing behind a login.
- [ ] Confirm rate limits are conservative (start at 1 request/sec or slower for anything not an official API).
- [ ] Every internship card links back to the original `apply_url` — you're an aggregator, not a re-host.
- [ ] Resume data (Phase 8) is personal data — private storage bucket, RLS, signed URLs with expiry, and a delete-my-data path for users.
- [ ] Add a short "Data sources & terms" page: which sources are official APIs, which are scraped, and a note that listings link to the original poster.
- [ ] This is not legal advice — if the site gets real traffic or monetizes, a one-off consult with someone who knows Indian DPDP + the relevant sites' terms is worth the cost before scaling Tier 2 sources.

---

## 5. New environment variables

| Var | Used by |
|---|---|
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | Adzuna adapter |
| `APIFY_TOKEN` / `APIFY_ACTOR_ID` | Internshala adapter (unchanged from original plan) |
| `ANTHROPIC_API_KEY` (or your chosen LLM provider key) | JD keyword parsing + resume bullet rewriting |
| `SUPABASE_STORAGE_BUCKET_RESUMES` | Resume tailoring pipeline |

---

## 6. Execution order

1. Phase 2 (revised) — get Greenhouse + Lever + Adzuna flowing first (no keys needed for the first two, fastest win).
2. Add Internshala adapter once Tier 1 sources are stable.
3. Phase 7 (ML upgrade) — only after real `interaction_events` exist from users actually using the deployed app.
4. Phase 8 (resume tailoring) — independent of the above, can be built in parallel by a second Antigravity session if you're splitting work.
5. Phase 9 — audit before any of this goes live for real users, not as an afterthought.
