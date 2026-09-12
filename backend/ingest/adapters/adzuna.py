"""
Adzuna adapter — Tier 1 (official partner API, free tier available).

Register at: https://developer.adzuna.com/
Set env vars: ADZUNA_APP_ID, ADZUNA_APP_KEY

Supports pagination and India-specific job search.
"""
import logging
import os

import requests

from .base import JobSourceAdapter

log = logging.getLogger(__name__)

ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs"


class AdzunaAdapter(JobSourceAdapter):
    source_name = "adzuna"

    def fetch(self, config: dict) -> list[dict]:
        """
        config: {
            "query": "internship",
            "country": "in",
            "results_per_page": 50,
            "max_pages": 5
        }
        """
        app_id = os.environ.get("ADZUNA_APP_ID")
        app_key = os.environ.get("ADZUNA_APP_KEY")

        if not app_id or not app_key:
            log.warning("Adzuna: ADZUNA_APP_ID / ADZUNA_APP_KEY not set — skipping.")
            return []

        country = config.get("country", "in")
        query = config.get("query", "internship")
        results_per_page = min(50, config.get("results_per_page", 50))
        max_pages = min(10, config.get("max_pages", 5))

        items: list[dict] = []
        for page in range(1, max_pages + 1):
            url = f"{ADZUNA_BASE_URL}/{country}/search/{page}"
            try:
                resp = requests.get(url, params={
                    "app_id": app_id,
                    "app_key": app_key,
                    "results_per_page": results_per_page,
                    "what": query,
                    "content-type": "application/json",
                }, timeout=30)
                resp.raise_for_status()
                data = resp.json()
                results = data.get("results", [])
                if not results:
                    break
                items.extend(results)
                log.info("Adzuna page %d: %d results", page, len(results))
                if len(results) < results_per_page:
                    break  # last page
            except Exception as exc:
                log.error("Adzuna page %d error: %s", page, exc)
                break

        return items

    def normalize(self, raw: dict) -> dict:
        company = raw.get("company") or {}
        company_name = company.get("display_name") if isinstance(company, dict) else str(company)

        location = raw.get("location") or {}
        location_name = location.get("display_name") if isinstance(location, dict) else str(location)

        # Adzuna salary fields
        salary_min = raw.get("salary_min")
        salary_max = raw.get("salary_max")
        stipend = salary_min or salary_max

        return {
            "external_id": str(raw["id"]),
            "source": self.source_name,
            "role_title": raw.get("title"),
            "location": location_name,
            "is_remote": "remote" in (location_name or "").lower(),
            "apply_url": raw.get("redirect_url"),
            "description": (raw.get("description") or "")[:4000],
            "company_name": company_name,
            "stipend": float(stipend) if stipend else None,
            "domain": _infer_domain(raw.get("title", ""), raw.get("category", {}).get("label", "")),
            "required_skills": [],  # Adzuna doesn't expose structured skills
        }


def _infer_domain(title: str, category_label: str = "") -> str | None:
    combined = (title + " " + category_label).lower()
    if any(k in combined for k in ["data science", "data analyst"]):
        return "Data Science"
    if any(k in combined for k in ["machine learning", "artificial intelligence", "ai "]):
        return "AI/ML"
    if any(k in combined for k in ["software engineer", "developer", "programming", "web"]):
        return "Web Dev"
    if any(k in combined for k in ["ios", "android", "mobile"]):
        return "Mobile Dev"
    if any(k in combined for k in ["design", "ux"]):
        return "Design"
    if any(k in combined for k in ["marketing", "seo", "content"]):
        return "Marketing"
    if any(k in combined for k in ["finance", "accounting"]):
        return "Finance"
    return None
