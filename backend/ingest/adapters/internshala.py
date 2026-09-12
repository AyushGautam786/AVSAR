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
            "maxItems": 100
        }
        """
        token = os.environ.get("APIFY_TOKEN")
        actor_id = os.environ.get("APIFY_ACTOR_ID")

        # If Apify token is provided, attempt Apify actor
        if token and actor_id and "your-apify" not in token:
            url = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"
            log.info("Internshala: starting Apify actor %s …", actor_id)
            try:
                resp = requests.post(url, params={"token": token}, json=config, timeout=600)
                resp.raise_for_status()
                items = resp.json()
                log.info("Internshala: actor returned %d items.", len(items))
                if items:
                    return items
            except Exception as exc:
                log.warning("Internshala Apify error: %s — falling back to direct scraper.", exc)

        # ── Direct Free Scraper (No Apify / No Payment Needed) ────────────────
        log.info("Internshala: fetching public listings directly (free mode) …")
        return self._fetch_direct(config)

    def _fetch_direct(self, config: dict) -> list[dict]:
        try:
            from bs4 import BeautifulSoup
        except ImportError:
            log.warning("BeautifulSoup not installed. Run: pip install beautifulsoup4")
            return []

        categories = config.get("categories") or ["computer-science-internship", "web-development-internship", "data-science-internship", "marketing-internship", "design-internship"]
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        items: list[dict] = []
        for cat in categories[:4]:
            endpoint = cat if cat.startswith("http") else f"https://internshala.com/internships/{cat}"
            try:
                resp = requests.get(endpoint, headers=headers, timeout=20)
                if resp.status_code != 200:
                    continue
                soup = BeautifulSoup(resp.text, "html.parser")
                cards = soup.select(".individual_internship")
                for card in cards:
                    try:
                        title_el = card.select_one(".job-title-href") or card.select_one("h3.job-internship-name") or card.select_one(".heading_4_5")
                        company_el = card.select_one(".company-name") or card.select_one(".company_name")
                        loc_el = card.select_one(".row-1-item.locations") or card.select_one(".location_link")
                        stipend_el = card.select_one(".stipend")
                        link_el = card.select_one("a.job-title-href") or card.select_one("a.view_detail_button")

                        title = title_el.get_text(strip=True) if title_el else ""
                        company = company_el.get_text(strip=True) if company_el else ""
                        location = loc_el.get_text(strip=True) if loc_el else "India"
                        stipend = stipend_el.get_text(strip=True) if stipend_el else ""
                        href = link_el.get("href", "") if link_el else ""
                        apply_url = f"https://internshala.com{href}" if href.startswith("/") else (href or "https://internshala.com/internships")

                        if title and company:
                            items.append({
                                "id": f"internshala_{len(items)+1}",
                                "title": title,
                                "company": company,
                                "location": location,
                                "stipend": stipend,
                                "url": apply_url,
                                "is_remote": "work from home" in location.lower(),
                                "category": cat.replace("-internship", "").replace("-", " ").title(),
                                "skills": [],
                            })
                    except Exception:
                        continue
            except Exception as exc:
                log.warning("Direct fetch error for %s: %s", cat, exc)

        log.info("Internshala: direct scraper gathered %d listings.", len(items))
        return items

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
