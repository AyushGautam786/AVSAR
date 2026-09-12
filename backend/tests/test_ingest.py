"""
AVSAR — Pure-Python unit tests for ingestion helpers and resume tailor utils.
These tests have ZERO dependency on sklearn/scipy/Supabase and run on any machine.

Run with:  pytest backend/tests/test_ingest.py -v
"""

import sys
import os

# Ensure backend/ is on path
BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import pytest
from ingest.run_ingestion import dedup_key, _normalize_str


# ── dedup_key ─────────────────────────────────────────────────────────────────

class TestDedupKey:
    def test_same_inputs_produce_same_key(self):
        k1 = dedup_key("TechCorp", "ML Intern", "Remote")
        k2 = dedup_key("TechCorp", "ML Intern", "Remote")
        assert k1 == k2

    def test_different_inputs_produce_different_keys(self):
        k1 = dedup_key("TechCorp", "ML Intern", "Remote")
        k2 = dedup_key("TechCorp", "Data Intern", "Remote")
        assert k1 != k2

    def test_key_is_normalized_case_insensitive(self):
        k1 = dedup_key("TECHCORP", "ML INTERN", "REMOTE")
        k2 = dedup_key("techcorp", "ml intern", "remote")
        assert k1 == k2

    def test_key_is_normalized_strips_punctuation(self):
        k1 = dedup_key("Tech Corp!", "ML-Intern", "Remote, India")
        k2 = dedup_key("Tech Corp", "ML Intern", "Remote India")
        assert k1 == k2

    def test_empty_strings_produce_valid_key(self):
        k = dedup_key("", "", "")
        assert isinstance(k, str)
        assert len(k) == 64  # sha256 hex = 64 chars

    def test_key_length_is_always_64(self):
        for company, title, loc in [
            ("A", "B", "C"),
            ("A very long company name Inc.", "Senior Software Engineering Intern - Platform Team", "Bangalore, Karnataka, India"),
        ]:
            assert len(dedup_key(company, title, loc)) == 64


class TestNormalizeStr:
    def test_lowercases(self):
        assert _normalize_str("HELLO") == "hello"

    def test_strips_non_alphanumeric(self):
        assert _normalize_str("Hello, World!") == "helloworld"

    def test_handles_none_like_empty_string(self):
        assert _normalize_str("") == ""

    def test_preserves_digits(self):
        assert _normalize_str("Tech2025") == "tech2025"


# ── Internshala adapter helpers ───────────────────────────────────────────────

from ingest.adapters.internshala import _parse_stipend, _parse_duration


class TestParseStipend:
    def test_plain_number(self):
        assert _parse_stipend("10000") == 10000.0

    def test_rupee_symbol(self):
        assert _parse_stipend("₹5,000") == 5000.0

    def test_range_takes_lower(self):
        # "5000 - 8000" → takes the lower bound
        assert _parse_stipend("5000 - 8000") == 5000.0

    def test_none_returns_none(self):
        assert _parse_stipend(None) is None

    def test_empty_string_returns_none(self):
        assert _parse_stipend("") is None

    def test_non_numeric_returns_none(self):
        assert _parse_stipend("Unpaid") is None

    def test_decimal_value(self):
        assert _parse_stipend("12500.50") == 12500.50


class TestParseDuration:
    def test_months(self):
        result = _parse_duration("3 months")
        assert result == 13  # round(3 * 4.33) = 13

    def test_weeks(self):
        assert _parse_duration("8 weeks") == 8

    def test_days(self):
        assert _parse_duration("14 days") == 2  # round(14/7) = 2

    def test_none_returns_none(self):
        assert _parse_duration(None) is None

    def test_no_match_returns_none(self):
        assert _parse_duration("flexible") is None

    def test_decimal_months(self):
        result = _parse_duration("1.5 months")
        assert result == round(1.5 * 4.33)

    def test_case_insensitive(self):
        assert _parse_duration("2 Months") == round(2 * 4.33)


# ── Resume tailor — ATS score (no LLM, no sklearn) ───────────────────────────

from resume_tailor.pipeline import ats_score, check_no_fabrication


class TestAtsScore:
    def test_full_coverage(self):
        score = ats_score("Python SQL Machine Learning", ["Python", "SQL", "Machine Learning"])
        assert score == 100.0

    def test_zero_coverage(self):
        score = ats_score("Java Spring Boot", ["Python", "SQL"])
        assert score == 0.0

    def test_partial_coverage(self):
        score = ats_score("Python developer", ["Python", "SQL"])
        assert score == 50.0

    def test_empty_keywords_returns_zero(self):
        assert ats_score("Python SQL", []) == 0.0

    def test_case_insensitive_match(self):
        score = ats_score("python sql", ["Python", "SQL"])
        assert score == 100.0


class TestFabricationGuard:
    def test_no_new_entities(self):
        flags = check_no_fabrication("Python TensorFlow", "Python TensorFlow")
        assert flags == []

    def test_detects_new_entity(self):
        # "Kubernetes" is new — wasn't in original
        flags = check_no_fabrication("Python TensorFlow", "Python TensorFlow Kubernetes")
        assert "Kubernetes" in flags

    def test_ignores_common_words(self):
        flags = check_no_fabrication("coding", "The Work Project Team")
        # Common words like "The", "Work", "Project", "Team" should not flag
        assert flags == []

    def test_empty_strings(self):
        assert check_no_fabrication("", "") == []
