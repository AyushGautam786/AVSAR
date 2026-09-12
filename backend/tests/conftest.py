"""
conftest.py — shared pytest fixtures and path setup for AVSAR backend tests.

Patches supabase to None BEFORE flask_api is imported so that:
  1. _load_or_train_model() short-circuits (no data → synthetic fallback only)
  2. No real Supabase connection is attempted during test collection
"""

import os
import sys
from unittest.mock import MagicMock, patch

# ── Ensure backend/ is on sys.path ────────────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# ── Required env vars (set before flask_api import) ───────────────────────────
os.environ.setdefault("SUPABASE_URL", "https://placeholder.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "placeholder-service-role-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "super-secret-test-jwt-secret-at-least-32-chars!!")
os.environ.setdefault("CORS_ORIGIN", "http://localhost:5173")

# ── Detect if sklearn/scipy is available (blocked on some locked Windows envs) ─
SKLEARN_AVAILABLE = False
try:
    import sklearn  # noqa: F401
    SKLEARN_AVAILABLE = True
except (ImportError, OSError):
    pass

import pytest


@pytest.fixture(scope="session")
def sklearn_available():
    """Skip tests that require sklearn if it's unavailable (e.g., DLL blocked)."""
    return SKLEARN_AVAILABLE


@pytest.fixture(scope="session")
def client():
    """
    Flask test client.
    Patches create_client to return None so supabase is None inside flask_api,
    which makes all DB calls no-op gracefully.
    """
    if not SKLEARN_AVAILABLE:
        pytest.skip("sklearn/scipy unavailable on this machine (DLL blocked) — skipping API tests")

    with patch("flask_api.create_client", return_value=None), \
         patch("flask_api.supabase", None):
        from flask_api import app
        app.config["TESTING"] = True
        with app.test_client() as c:
            yield c
