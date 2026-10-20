# Deploying AVSAR to Render

This guide walks you through deploying **AVSAR** (Flask Backend + React Frontend + Supabase DB) to **Render.com** on the **100% Free Tier**.

---

## Architecture on Render

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│     avsar-frontend              │           │     avsar-backend               │
│     Render Static Site          │           │     Render Web Service          │
│     (React 19 + Vite 7)         │           │     (Python 3.11 + Flask + ML)  │
│     https://*.onrender.com      │           │     https://*.onrender.com      │
└────────────────┬────────────────┘           └──────────────┬──────────────────┘
                 │            ▲                              │
                 │            │                              │
                 │            └────── REST API Calls ────────┤
                 ▼                                           ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           Supabase (Cloud)                                    │
│       PostgreSQL Database  •  Auth (JWT / OAuth)  •  Storage (Resumes)        │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites (5 Minutes)

Before deploying to Render, have these credentials ready:

### 1. Supabase Project
1. Log in to [Supabase](https://supabase.com) and create a free project.
2. Open the **SQL Editor** in Supabase and run the schema migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_job_sources_seed.sql`
   - `supabase/migrations/0003_resumes.sql`
3. Go to **Storage** and ensure the `resumes` bucket exists (private). You can also run `python backend/setup_storage.py` once connected.
4. Collect your credentials:
   - **Project URL**: `https://<project-ref>.supabase.co` (Dashboard -> Settings -> API)
   - **Anon Key**: Under *Project API keys* -> `anon` / `public`
   - **Service Role Key**: Under *Project API keys* -> `service_role` (keep secret!)
   - **JWT Secret**: Under *Settings* -> *API* -> *JWT Secret*

### 2. Free LLM Key (for Resume Lab)
- **Groq (Recommended & 100% Free)**: Create a free key at [console.groq.com/keys](https://console.groq.com/keys).
- *(Optional)* **Google Gemini**: Get a free API key at [aistudio.google.com](https://aistudio.google.com/).

---

## Method 1: Blueprint 1-Click Deployment (Recommended)

Render's [Infrastructure as Code (Blueprint)](render.yaml) automatically provisions both the backend and frontend with optimal settings.

### Step 1: Push Repository to GitHub
Ensure your latest code is pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: configure render deployment"
git push origin main
```

### Step 2: Create Blueprint on Render
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** (top right) and select **Blueprint**.
3. Connect your GitHub repository (`AVSAR`).
4. Render detects [`render.yaml`](render.yaml) and prepares two services:
   - `avsar-backend` (Web Service, Python)
   - `avsar-frontend` (Static Site, Node)
5. Fill in the prompted environment variables:

| Variable | Service | Value / Where to find |
|---|---|---|
| `SUPABASE_URL` | Backend | `https://<your-project>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Supabase Service Role Secret Key |
| `SUPABASE_JWT_SECRET` | Backend | Supabase API JWT Secret |
| `GROQ_API_KEY` | Backend | Your free Groq API key |
| `VITE_SUPABASE_URL` | Frontend | Same as `SUPABASE_URL` |
| `VITE_SUPABASE_KEY` | Frontend | Supabase `anon` public key |

> **Note:** `VITE_API_URL` is automatically wired to the backend URL via Render's `fromService` binding!

6. Click **Apply**.
7. Render will build and deploy both services in parallel. Once completed, your app is live!

---

## Method 2: Manual Setup via Render Dashboard

If you prefer to configure each service manually without Blueprints:

### Part 1: Deploy Backend (`avsar-backend`)
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Name**: `avsar-backend`
   - **Region**: Oregon (or your preferred region)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn flask_api:app --workers 1 --threads 4 --timeout 120 --bind 0.0.0.0:$PORT`
   - **Health Check Path**: `/api/health`
   - **Instance Type**: Free
4. Under **Environment Variables**, add:
   - `PYTHON_VERSION`: `3.11.9`
   - `SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-service-role-key`
   - `SUPABASE_JWT_SECRET`: `your-jwt-secret`
   - `LLM_PROVIDER`: `groq`
   - `GROQ_API_KEY`: `your-groq-key`
   - `SUPABASE_STORAGE_BUCKET_RESUMES`: `resumes`
5. Click **Create Web Service**. Note your backend URL (e.g., `https://avsar-backend.onrender.com`).

### Part 2: Deploy Frontend (`avsar-frontend`)
1. Click **New +** -> **Static Site**.
2. Connect the same repository.
3. Configure:
   - **Name**: `avsar-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Redirects / Rewrites**, add an SPA rewrite rule:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
5. Under **Environment Variables**, add:
   - `NODE_VERSION`: `20.18.0`
   - `VITE_API_URL`: `https://avsar-backend.onrender.com` (your backend URL from Part 1)
   - `VITE_SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `VITE_SUPABASE_KEY`: `your-supabase-anon-key`
6. Click **Create Static Site**.

---

## Verification & Health Check

1. **Verify Backend**:
   Open `https://<your-backend>.onrender.com/api/health` in your browser. You should receive:
   ```json
   {
     "model_trained": true,
     "status": "healthy",
     "supabase_connected": true,
     "timestamp": "2026-10-14T..."
   }
   ```

2. **Verify Frontend**:
   Open `https://<your-frontend>.onrender.com`.
   - Test browsing internships.
   - Test signing in with Supabase Auth.
   - Test the AI Resume Tailor lab with a sample PDF/Word resume.

---

## Tips & Troubleshooting

### 1. Free Tier Inactivity (Cold Start)
- Render Free Web Services sleep after 15 minutes of inactivity. The first request after sleep may take ~40–50 seconds to spin up.
- **Tip (Keep Alive for Free)**: You can use a free ping monitor such as [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com) to ping `https://<your-backend>.onrender.com/api/health` every 10–14 minutes.

### 2. CORS Handling
- The backend API automatically accepts requests from:
  - Any `*.onrender.com` subdomain (including preview builds)
  - `localhost` / `127.0.0.1` dev servers
  - Custom domains set in the `CORS_ORIGIN` environment variable.

### 3. Memory Optimization on Free Tier (512 MB)
- Scikit-learn and Pandas load in-memory. The Gunicorn configuration uses `--workers 1 --threads 4` which uses ~120 MB RAM, keeping resource usage safe well below Render's 512 MB free tier ceiling.

---

## Summary Checklist

- [x] `render.yaml` configured with monorepo `rootDir` and service bindings
- [x] Gunicorn start command optimized for 512 MB RAM limit
- [x] Node version pinned to `20.18.0` for Vite 7 / React 19 compatibility
- [x] Zero hardcoded `localhost:5000` URLs in frontend production code
- [x] Dynamic and static CORS permissions for all `*.onrender.com` URLs
- [x] Zero-downtime health check route `/api/health` configured
- [x] Daily ingestion scheduled via GitHub Actions (`.github/workflows/ingest.yml`)
