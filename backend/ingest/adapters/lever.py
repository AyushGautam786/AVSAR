"""
Lever adapter — Tier 1 (official public API, no auth required).

Lever exposes public job postings at:
  https://api.lever.co/v0/postings/{company}?mode=json

The company slug is the subdomain of their careers page:
  https://jobs.lever.co/{company}

No API key needed. Use conservatively — not an official documented SLA.
"""
import logging
import time

import requests

from .base import JobSourceAdapter

log = logging.getLogger(__name__)


class LeverAdapter(JobSourceAdapter):
    source_name = "lever"

    def fetch(self, config: dict) -> list[dict]:
        """
        config: {"companies": ["netflix", "rippling", ...]}
        """
        companies: list[str] = config.get("companies", [])
        if not companies:
            log.warning("Lever: no companies configured — skipping.")
            return []

        items: list[dict] = []
        for company in companies:
            url = f"https://api.lever.co/v0/postings/{company}"
            try:
                resp = requests.get(url, params={"mode": "json"}, timeout=30)
                if resp.status_code == 404:
                    log.warning("Lever: company '%s' not found — skipping.", company)
                    continue
                resp.raise_for_status()
                postings = resp.json()
                for job in postings:
                    job["_company"] = company
                    items.append(job)
                log.info("Lever [%s]: %d postings", company, len(postings))
            except Exception as exc:
                log.error("Lever [%s] fetch error: %s", company, exc)
            time.sleep(0.5)

        return items

    def normalize(self, raw: dict) -> dict:
        categories = raw.get("categories") or {}
        location = categories.get("location") or raw.get("workplaceType")

        # Extract plain-text description (Lever provides descriptionPlain)
        description = raw.get("descriptionPlain") or raw.get("description") or ""
        if description:
            description = description[:4000]

        # Skills are sometimes in the lists array
        skills: list[str] = []
        for lst in raw.get("lists", []):
            if "skill" in (lst.get("text") or "").lower():
                content = lst.get("content") or ""
                # Strip HTML list items
                import re
                bullets = re.findall(r"<li>(.*?)</li>", content, re.IGNORECASE)
                skills.extend([re.sub(r"<[^>]+>", "", b).strip() for b in bullets])

        return {
            "external_id": raw["id"],
            "source": self.source_name,
            "role_title": raw.get("text"),
            "location": location,
            "is_remote": raw.get("workplaceType", "").lower() == "remote",
            "apply_url": raw.get("hostedUrl"),
            "description": description,
            "company_name": raw["_company"],
            "domain": _infer_domain(raw.get("text", ""), categories.get("team", "")),
            "required_skills": skills[:20],
        }


def _infer_domain(title: str, team: str = "") -> str | None:
    combined = (title + " " + team).lower()
    if any(k in combined for k in ["data science", "data analyst", "analytics"]):
        return "Data Science"
    if any(k in combined for k in ["machine learning", "ml", "ai ", "nlp"]):
        return "AI/ML"
    if any(k in combined for k in ["frontend", "front-end", "react", "vue", "angular"]):
        return "Web Dev"
    if any(k in combined for k in ["backend", "back-end", "platform", "infra"]):
        return "Web Dev"
    if any(k in combined for k in ["ios", "android", "mobile"]):
        return "Mobile Dev"
    if any(k in combined for k in ["design", "ux", "product design"]):
        return "Design"
    if any(k in combined for k in ["marketing", "growth", "seo", "content"]):
        return "Marketing"
    if any(k in combined for k in ["finance", "accounting"]):
        return "Finance"
    return None
