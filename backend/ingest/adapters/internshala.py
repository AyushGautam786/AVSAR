"""
Internshala adapter — Tier 2 (via Apify actor).

Uses Apify to scrape Internshala's public listing pages.
The actor handles pagination, rate-limiting, and robots.txt compliance
at the actor level — leave concurrency at conservative defaults.

Required env vars: APIFY_TOKEN, APIFY_ACTOR_ID
"""
import logging
import os
import re

import requests

from .base import JobSourceAdapter

log = logging.getLogger(__name__)


class InternshalaApifyAdapter(JobSourceAdapter):
    source_name = "internshala"

    def fetch(self, config: dict) -> list[dict]:
        """
        config: {
            "categories": ["computer-science", "web-development", ...],
            "cities": ["all-india"],
            "maxItems": 500
        }
        """
        token = os.environ.get("APIFY_TOKEN")
        actor_id = os.environ.get("APIFY_ACTOR_ID")

        if not token or not actor_id:
            log.warning("Internshala: APIFY_TOKEN or APIFY_ACTOR_ID not set — skipping.")
            return []

        url = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"
        log.info("Internshala: starting Apify actor %s …", actor_id)
        try:
            resp = requests.post(url, params={"token": token}, json=config, timeout=600)
            resp.raise_for_status()
            items = resp.json()
            log.info("Internshala: actor returned %d items.", len(items))
            return items
        except Exception as exc:
            log.error("Internshala Apify error: %s", exc)
            return []

    def normalize(self, raw: dict) -> dict:
        location_raw = raw.get("location") or raw.get("city") or ""
        is_remote = "work from home" in location_raw.lower() or raw.get("is_remote", False)

        skills = raw.get("skills") or raw.get("skill_list") or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]

        return {
            "external_id": raw.get("url") or raw.get("link") or raw.get("id"),
            "source": self.source_name,
            "role_title": raw.get("title") or raw.get("role") or raw.get("internship_title"),
            "domain": raw.get("category") or raw.get("domain") or raw.get("field"),
            "location": location_raw,
            "is_remote": is_remote,
            "required_skills": skills[:20],
            "description": (raw.get("description") or raw.get("about") or "")[:4000],
            "stipend": _parse_stipend(raw.get("stipend") or raw.get("salary")),
            "duration_weeks": _parse_duration(raw.get("duration") or raw.get("internship_duration")),
            "application_deadline": (
                raw.get("applyBy") or raw.get("apply_by") or
                raw.get("deadline") or raw.get("last_date")
            ),
            "apply_url": raw.get("url") or raw.get("link") or raw.get("apply_url"),
            "company_name": (
                raw.get("company") or raw.get("company_name") or
                raw.get("organization") or "Unknown"
            ),
        }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_stipend(raw) -> float | None:
    if raw is None:
        return None
    text = str(raw).replace("₹", "").replace(",", "").strip()
    text = text.split("-")[0].strip()
    text = re.sub(r"[^0-9.]", "", text)
    try:
        return float(text) if text else None
    except ValueError:
        return None


def _parse_duration(raw) -> int | None:
    if raw is None:
        return None
    text = str(raw).lower().strip()
    match = re.search(r"(\d+(?:\.\d+)?)\s*(month|week|day)", text)
    if not match:
        return None
    value, unit = float(match.group(1)), match.group(2)
    if unit == "month":
        return round(value * 4.33)
    if unit == "week":
        return round(value)
    if unit == "day":
        return round(value / 7)
    return None
