"""
Greenhouse adapter — Tier 1 (official public API, no auth required).

Greenhouse job boards expose a public JSON API at:
  https://boards-api.greenhouse.io/v1/boards/{company_token}/jobs

The company_token appears in the careers page URL:
  https://boards.greenhouse.io/{company_token}

No API key is needed. Rate-limit generously — there's no SLA guarantee.
"""
import logging
import time

import requests

from .base import JobSourceAdapter

log = logging.getLogger(__name__)


class GreenhouseAdapter(JobSourceAdapter):
    source_name = "greenhouse"

    def fetch(self, config: dict) -> list[dict]:
        """
        config: {"companies": ["stripe", "notion", ...]}
        Returns all jobs for each company token.
        """
        companies: list[str] = config.get("companies", [])
        if not companies:
            log.warning("Greenhouse: no companies configured — skipping.")
            return []

        items: list[dict] = []
        for token in companies:
            url = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs"
            try:
                resp = requests.get(url, params={"content": "true"}, timeout=30)
                if resp.status_code == 404:
                    log.warning("Greenhouse: company token '%s' not found — skipping.", token)
                    continue
                resp.raise_for_status()
                for job in resp.json().get("jobs", []):
                    job["_company_token"] = token
                    items.append(job)
                log.info("Greenhouse [%s]: %d jobs", token, len(resp.json().get("jobs", [])))
            except Exception as exc:
                log.error("Greenhouse [%s] fetch error: %s", token, exc)
            time.sleep(0.5)  # be a good citizen

        return items

    def normalize(self, raw: dict) -> dict:
        # Location is a nested dict
        loc = raw.get("location") or {}
        location = loc.get("name") if isinstance(loc, dict) else str(loc)

        # Strip HTML from content/description
        description = raw.get("content", "") or ""
        try:
            import re
            description = re.sub(r"<[^>]+>", " ", description).strip()
        except Exception:
            pass

        return {
            "external_id": str(raw["id"]),
            "source": self.source_name,
            "role_title": raw.get("title"),
            "location": location,
            "is_remote": "remote" in (location or "").lower(),
            "apply_url": raw.get("absolute_url"),
            "description": description[:4000] if description else None,
            "company_name": raw.get("_company_token"),
            "domain": _infer_domain(raw.get("title", "")),
            "required_skills": [],  # Greenhouse doesn't expose skills directly
        }


def _infer_domain(title: str) -> str | None:
    """Rough domain inference from job title keywords."""
    t = title.lower()
    if any(k in t for k in ["data science", "data analyst", "analytics"]):
        return "Data Science"
    if any(k in t for k in ["machine learning", "ml engineer", "ai ", "nlp"]):
        return "AI/ML"
    if any(k in t for k in ["frontend", "front-end", "react", "ui engineer"]):
        return "Web Dev"
    if any(k in t for k in ["backend", "back-end", "api engineer", "platform"]):
        return "Web Dev"
    if any(k in t for k in ["ios", "android", "mobile"]):
        return "Mobile Dev"
    if any(k in t for k in ["design", "ux", "ui/ux"]):
        return "Design"
    if any(k in t for k in ["marketing", "growth", "seo", "content"]):
        return "Marketing"
    if any(k in t for k in ["finance", "accounting", "analyst"]):
        return "Finance"
    return None
