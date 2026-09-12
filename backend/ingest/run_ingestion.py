"""
AVSAR — Multi-Source Ingestion Orchestrator
============================================
Reads enabled sources from the `job_sources` Supabase table,
dispatches to the correct adapter, deduplicates, and upserts into `internships`.

Usage:
    cd backend
    python -m ingest.run_ingestion

Environment variables (see .env.example):
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
    ADZUNA_APP_ID, ADZUNA_APP_KEY      (Adzuna adapter)
    APIFY_TOKEN, APIFY_ACTOR_ID        (Internshala adapter)
"""

import hashlib
import logging
import os
import re
from datetime import datetime, timezone

from dotenv import load_dotenv
from supabase import create_client, Client

from ingest.adapters.greenhouse import GreenhouseAdapter
from ingest.adapters.lever import LeverAdapter
from ingest.adapters.adzuna import AdzunaAdapter
from ingest.adapters.internshala import InternshalaApifyAdapter

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
log = logging.getLogger("avsar_ingest")

# ── Registry ──────────────────────────────────────────────────────────────────

ADAPTERS = {
    "greenhouse": GreenhouseAdapter(),
    "lever": LeverAdapter(),
    "adzuna": AdzunaAdapter(),
    "internshala": InternshalaApifyAdapter(),
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalize_str(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def dedup_key(company: str, title: str, location: str) -> str:
    """
    Stable, normalized hash of company+title+location.
    Near-duplicate postings from different boards collapse to the same key.
    """
    raw = _normalize_str(company) + _normalize_str(title) + _normalize_str(location)
    return hashlib.sha256(raw.encode()).hexdigest()


def upsert_company(supabase: Client, name: str) -> str | None:
    if not name or name.strip().lower() in ("unknown", ""):
        return None
    name = name.strip()
    existing = supabase.table("companies").select("id").eq("name", name).execute()
    if existing.data:
        return existing.data[0]["id"]
    created = supabase.table("companies").insert(
        {"name": name, "source": "ingestion"}
    ).execute()
    return created.data[0]["id"]


# ── Main ──────────────────────────────────────────────────────────────────────

def run():
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase: Client = create_client(supabase_url, supabase_key)

    # Fetch all enabled sources from config table
    sources_resp = (
        supabase.table("job_sources")
        .select("*")
        .eq("enabled", True)
        .execute()
    )
    sources = sources_resp.data
    if not sources:
        log.warning("No enabled job_sources found — nothing to do.")
        return

    log.info("Running ingestion for %d sources: %s", len(sources), [s["name"] for s in sources])

    # Collect all currently-active external_ids to mark stale ones later
    active_before: set[str] = set(
        row["external_id"]
        for row in supabase.table("internships")
        .select("external_id")
        .eq("is_active", True)
        .execute()
        .data
        if row.get("external_id")
    )

    ingested_ext_ids: set[str] = set()
    total_success = 0
    total_errors = 0

    for source_row in sources:
        source_name = source_row["name"]
        adapter = ADAPTERS.get(source_name)
        if not adapter:
            log.warning("No adapter registered for source '%s' — skipping.", source_name)
            continue

        log.info("=== Ingesting: %s ===", source_name)
        run_status = "ok"

        try:
            raw_items = adapter.fetch(source_row["config"] or {})
        except Exception as exc:
            log.error("%s: fetch failed — %s", source_name, exc)
            run_status = f"error: {exc}"
            raw_items = []

        success = 0
        errors = 0

        for raw in raw_items:
            try:
                normalized = adapter.normalize(raw)

                # Require at minimum a role_title and an external_id
                if not normalized.get("role_title") or not normalized.get("external_id"):
                    log.debug("%s: skipping item missing role_title or external_id", source_name)
                    continue

                # Safe defaults for nullable columns that break queries when absent
                if not normalized.get("domain"):
                    normalized["domain"] = "General"
                if not normalized.get("duration_weeks"):
                    normalized["duration_weeks"] = 12

                # Upsert company and inject FK
                company_name = normalized.pop("company_name", None) or "Unknown"
                company_id = upsert_company(supabase, company_name)
                normalized["company_id"] = company_id

                # Compute dedup key
                dk = dedup_key(
                    company_name,
                    normalized.get("role_title", ""),
                    normalized.get("location", ""),
                )
                normalized["dedup_key"] = dk

                # Cross-source dedup: skip if an equivalent posting already exists
                # (same company+title+location hash, regardless of source)
                existing = (
                    supabase.table("internships")
                    .select("id, source")
                    .eq("dedup_key", dk)
                    .neq("source", source_name)  # allow same-source upsert
                    .eq("is_active", True)
                    .limit(1)
                    .execute()
                )
                if existing.data:
                    log.debug(
                        "%s: skipping duplicate '%s' — already exists from source '%s'",
                        source_name, normalized.get("role_title"), existing.data[0]["source"]
                    )
                    continue

                # Timestamps
                now_iso = datetime.now(timezone.utc).isoformat()
                normalized["scraped_at"] = now_iso
                normalized["last_seen_at"] = now_iso
                normalized["is_active"] = True

                supabase.table("internships").upsert(
                    normalized,
                    on_conflict="source,external_id",
                ).execute()

                ingested_ext_ids.add(normalized["external_id"])
                success += 1

            except Exception as exc:
                log.error("%s: upsert error for item %s — %s",
                          source_name, raw.get("url", raw.get("id", "?")), exc)
                errors += 1

        total_success += success
        total_errors += errors
        log.info("%s: upserted %d, errors %d", source_name, success, errors)

        # Update source run status
        try:
            supabase.table("job_sources").update({
                "last_run_at": datetime.now(timezone.utc).isoformat(),
                "last_run_status": run_status if errors == 0 else f"partial ({errors} errors)",
            }).eq("id", source_row["id"]).execute()
        except Exception as exc:
            log.warning("Could not update job_sources.last_run_at: %s", exc)

    # Mark internships no longer returned by any source as inactive
    stale_ids = active_before - ingested_ext_ids
    if stale_ids:
        log.info("Marking %d stale internships as inactive …", len(stale_ids))
        try:
            supabase.table("internships").update({"is_active": False}).in_(
                "external_id", list(stale_ids)
            ).execute()
        except Exception as exc:
            log.warning("Could not mark stale internships inactive: %s", exc)

    log.info(
        "Ingestion complete — total upserted: %d, errors: %d, stale marked inactive: %d",
        total_success, total_errors, len(stale_ids),
    )


if __name__ == "__main__":
    run()
