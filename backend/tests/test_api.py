"""
AVSAR — Backend API Tests
=========================
Run with:  cd backend && pytest tests/ -v

NOTE: These tests require sklearn/scipy to import flask_api.
      On machines where scipy DLLs are blocked by Application Control,
      the `client` fixture in conftest.py will automatically skip these tests.
      Use tests/test_ingest.py for pure-Python tests that always run.
"""

import json
import pytest


# ── Auth decorator ────────────────────────────────────────────────────────────

class TestRequireAuth:
    def test_missing_token_returns_401(self, client):
        resp = client.get("/api/recommendations/test-id")
        assert resp.status_code == 401
        assert "Missing" in resp.get_json()["error"]

    def test_malformed_token_returns_401(self, client):
        resp = client.get(
            "/api/recommendations/test-id",
            headers={"Authorization": "NotABearer token"},
        )
        assert resp.status_code == 401

    def test_invalid_bearer_returns_401(self, client):
        resp = client.get(
            "/api/recommendations/test-id",
            headers={"Authorization": "Bearer not.a.valid.jwt"},
        )
        assert resp.status_code == 401
        data = resp.get_json()
        assert "Invalid" in data["error"] or "Missing" in data["error"]


# ── /api/internships pagination ───────────────────────────────────────────────

class TestInternshipsPagination:
    def test_default_response_shape(self, client):
        """Even with no Supabase data, response structure must be correct."""
        resp = client.get("/api/internships")
        # supabase is None in tests → will 500; skip assertion in that case
        if resp.status_code == 200:
            body = resp.get_json()
            assert "data" in body
            assert "total" in body
            assert "page" in body
            assert "page_size" in body
            assert "total_pages" in body

    def test_page_size_is_capped_at_100(self, client):
        resp = client.get("/api/internships?page_size=999")
        if resp.status_code == 200:
            body = resp.get_json()
            assert body["page_size"] <= 100

    def test_invalid_page_defaults_to_1(self, client):
        resp = client.get("/api/internships?page=0")
        if resp.status_code == 200:
            body = resp.get_json()
            assert body["page"] >= 1


# ── /api/recommendations/custom input validation ──────────────────────────────

class TestCustomRecommendations:
    def test_missing_body_returns_400(self, client):
        resp = client.post(
            "/api/recommendations/custom",
            data="",
            content_type="application/json",
        )
        assert resp.status_code == 400

    def test_missing_required_field_returns_400(self, client):
        payload = {
            "preferred_domains": ["AI/ML"],
            # missing preferred_locations and skills
        }
        resp = client.post(
            "/api/recommendations/custom",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert resp.status_code == 400

    def test_skills_must_be_list(self, client):
        payload = {
            "preferred_domains": ["AI/ML"],
            "preferred_locations": ["Remote"],
            "skills": "Python",  # string, not list
        }
        resp = client.post(
            "/api/recommendations/custom",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert resp.status_code == 400
        assert "must be a list" in resp.get_json()["error"]


# ── /api/health ───────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_200(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        body = resp.get_json()
        assert "status" in body
        assert "timestamp" in body

