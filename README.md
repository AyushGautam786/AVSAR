# AVSAR — AI-Powered Internship Recommender

> **A**I-powered **V**ocation & **S**kill **A**lignment **R**ecommender — matches students to internships using ML, semantic embeddings, and interaction-event feedback loops.

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue?logo=react)](frontend/)
[![Backend](https://img.shields.io/badge/Backend-Flask%20%2B%20Supabase-green?logo=flask)](backend/)

---

## Features

| Feature | Details |
|---------|---------|
| 🤖 ML Recommendations | Random Forest + sentence-transformers semantic embeddings |
| 🔁 Feedback Loop | Interaction events (view/click/save/apply) retrain the model |
| 🔍 Explainability | Every recommendation shows `matched_skills`, `missing_skills`, and `match_reasons` |
| 📄 Resume Tailoring | AI rewrites resume bullets to match JD keywords (anti-fabrication guard built-in) |
| 📊 ATS Scoring | Keyword coverage score before & after tailoring |
| 🌐 Multi-source Ingest | Adzuna API + Internshala (via Apify) with cross-source deduplication |
| 🔐 Auth | Google OAuth via Supabase |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind-free Vanilla CSS |
| Backend | Flask, Gunicorn, Flask-Limiter |
| Database | Supabase (Postgres) |
| ML | scikit-learn (Random Forest), sentence-transformers |
| LLM | Anthropic Claude (resume tailoring) |
| Storage | Supabase Storage (resume files) |
| CI/CD | GitHub Actions → Render |

---

## Project Structure

```
AVSAR/
├── frontend/          # React + TypeScript app (Vite)
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # useApi, useAuth
│   │   ├── pages/       # Route-level pages
│   │   └── types/       # Shared TypeScript types
│   └── .env.example
├── backend/           # Flask API
│   ├── flask_api.py       # Main API (all routes)
│   ├── ml_recommender.py  # ML model (Random Forest + embeddings)
│   ├── resume_tailor/     # Resume tailoring pipeline
│   ├── ingest/            # Multi-source ingestion adapters
│   │   └── adapters/      # Adzuna, Internshala, Greenhouse, Lever
│   └── tests/             # pytest test suite
├── supabase/
│   └── migrations/    # SQL schema migrations
└── render.yaml        # Render.com deployment config
```

---

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_KEY` | ✅ | Supabase `anon` public key |
| `VITE_API_URL` | ✅ | Backend URL (e.g. `http://localhost:5000`) |

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (never expose publicly) |
| `SUPABASE_JWT_SECRET` | ✅ | From Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | ✅ | For resume tailoring LLM calls |
| `CORS_ORIGIN` | ✅ | Frontend origin (e.g. `http://localhost:5173`) |
| `SUPABASE_STORAGE_BUCKET_RESUMES` | optional | Bucket name (default: `resumes`) |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | optional | Adzuna job feed |
| `APIFY_TOKEN` / `APIFY_ACTOR_ID` | optional | Internshala via Apify |

---

## Local Development

### 1. Clone & install

```bash
git clone https://github.com/AyushGautam786/AVSAR.git
cd AVSAR
```

### 2. Set up the database

1. Create a [Supabase](https://supabase.com) project.
2. Run migrations in order:

```bash
# In the Supabase SQL editor (or via psql):
# supabase/migrations/0001_init.sql
# supabase/migrations/0002_job_sources_seed.sql
# supabase/migrations/0003_resumes.sql
```

3. Create a Storage bucket named `resumes` (private).

### 3. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your values

python flask_api.py
# → Running on http://127.0.0.1:5000
```

### 4. Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Edit .env with your Supabase + API URL

npm run dev
# → Running on http://localhost:5173
```

---

## Running Tests

```bash
cd backend

# Pure-Python tests (no sklearn required — always run):
venv\Scripts\python -m pytest tests/test_ingest.py -v

# Full test suite (requires sklearn/scipy available):
venv\Scripts\python -m pytest tests/ -v
```

> **Note:** On machines with Application Control (AppLocker/Windows Defender) that block scipy DLLs, use `test_ingest.py` only. CI runs the full suite in a clean Linux environment.

---

## Running Ingestion

```bash
cd backend
venv\Scripts\python -m ingest.run_ingestion
```

Requires at least one enabled row in the `job_sources` Supabase table with a valid adapter name (`adzuna`, `internshala`, `greenhouse`, `lever`) and `enabled = true`.

---

## Deployment

Configured for [Render](https://render.com) via [`render.yaml`](render.yaml):

- **Frontend**: Static site → Vite build
- **Backend**: Web service → Gunicorn (`gunicorn flask_api:app`)

---

## Architecture

```
┌──────────────────┐     REST API      ┌──────────────────────────────┐
│  React Frontend  │ ←──────────────→  │  Flask Backend               │
│  (Vite + TS)     │                   │  ├── ML Recommender           │
│                  │   Supabase SDK    │  ├── Resume Tailor Pipeline   │
│                  │ ←──────────────→  │  └── Ingestion Orchestrator   │
└──────────────────┘                   └──────────────────────────────┘
         ↕                                          ↕
  Supabase Auth                             Supabase Postgres
  (Google OAuth)                            + Storage (resumes)
```

---

## License

MIT © Ayush Gautam
