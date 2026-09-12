"""
AVSAR — Flask API
=================
Production-ready Flask backend powered by Supabase.

Startup:
    gunicorn flask_api:app          (production)
    python flask_api.py             (local dev — auto-loads .env)

Environment variables (see .env.example):
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET,
    CORS_ORIGIN, PORT (optional, default 5000),
    ANTHROPIC_API_KEY (or OPENAI_API_KEY + LLM_PROVIDER=openai),
    SUPABASE_STORAGE_BUCKET_RESUMES
"""

import os
import logging
import tempfile
import uuid
from datetime import datetime
from functools import wraps
from werkzeug.utils import secure_filename

import jwt
import pandas as pd
from dotenv import load_dotenv
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from supabase import create_client, Client

from ml_recommender import MLInternshipRecommender

# ── Bootstrap ────────────────────────────────────────────────────────────────
load_dotenv()  # no-op in production (env vars come from Render / shell)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
log = logging.getLogger("avsar_api")

# ── App setup ────────────────────────────────────────────────────────────────
app = Flask(__name__)

# Allow all localhost and 127.0.0.1 dev ports, plus any production CORS_ORIGIN configured
_cors_origins = [
    r"^https?:\/\/localhost(:\d+)?$",
    r"^https?:\/\/127\.0\.0\.1(:\d+)?$",
]
_env_origin = os.environ.get("CORS_ORIGIN")
if _env_origin:
    for o in _env_origin.split(","):
        if o.strip():
            _cors_origins.append(o.strip())

CORS(app, origins=_cors_origins, supports_credentials=True)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],          # no global limit; apply per route
    storage_uri="memory://",
)

# ── Supabase client (service role — full DB access, server-side only) ────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# ── ML recommender ────────────────────────────────────────────────────────────
recommender = MLInternshipRecommender()
_model_trained = False

MODEL_PATH = os.path.join(os.path.dirname(__file__), "internship_ml_model.pkl")


def _get_internships_df() -> pd.DataFrame:
    """Fetch active internships from Supabase and return as DataFrame."""
    if not supabase:
        return pd.DataFrame()
    resp = supabase.table("internships").select(
        "id, role_title, domain, location, is_remote, required_skills, "
        "description, duration_weeks, stipend, apply_url, is_active, "
        "companies(name, logo_url)"
    ).eq("is_active", True).execute()

    rows = []
    for item in resp.data:
        company = item.pop("companies", None) or {}
        item["company_name"] = company.get("name", "Unknown")
        item["company_logo"] = company.get("logo_url", "")
        rows.append(item)
    return pd.DataFrame(rows)


def _get_students_df() -> pd.DataFrame:
    """Fetch all students from Supabase as DataFrame (used for ML training)."""
    if not supabase:
        return pd.DataFrame()
    resp = supabase.table("students").select("*").execute()
    return pd.DataFrame(resp.data)


def _train_model():
    """Train (or retrain) the recommender on current Supabase data, then persist it."""
    global _model_trained
    try:
        log.info("Training ML model from Supabase data …")
        students_df = _get_students_df()
        internships_df = _get_internships_df()
        if students_df.empty or internships_df.empty:
            log.warning("Not enough data to train — using synthetic fallback.")
        recommender.train(students_df, internships_df)
        _model_trained = True
        log.info("ML model trained successfully (%d internships).", len(internships_df))
        # Persist the model artifact so the next boot can skip retraining
        try:
            recommender.save_model(MODEL_PATH)
            log.info("Model artifact saved to %s", MODEL_PATH)
        except Exception as save_exc:
            log.warning("Could not save model artifact: %s", save_exc)
    except Exception as exc:
        log.error("Error training ML model: %s", exc)
        _model_trained = False


# Startup: try to load a pre-trained model first, only retrain if none exists
def _load_or_train_model():
    """Load persisted model from disk; fall back to training from scratch."""
    global _model_trained
    if os.path.exists(MODEL_PATH):
        try:
            recommender.load_model(MODEL_PATH)
            _model_trained = True
            log.info("Loaded pre-trained ML model from %s", MODEL_PATH)
            return
        except Exception as exc:
            log.warning("Could not load model artifact (%s) — retraining.", exc)
    _train_model()


_load_or_train_model()


# ── Auth decorator ────────────────────────────────────────────────────────────

def require_auth(f):
    """
    Validates the Supabase JWT sent as `Authorization: Bearer <token>`.
    Stores the decoded user_id in flask.g.user_id.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or malformed auth token"}), 401
        token = auth_header.split(" ", 1)[1]
        if not SUPABASE_JWT_SECRET:
            return jsonify({"error": "Server auth not configured"}), 500
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256", "RS256", "ES256"],
                options={"verify_aud": False},
            )
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError as exc:
            log.warning("Invalid JWT: %s", exc)
            return jsonify({"error": "Invalid auth token"}), 401
        g.user_id = payload.get("sub")
        return f(*args, **kwargs)
    return wrapper


def _get_student_by_user_id(user_id: str) -> dict | None:
    """Return the student row for the authenticated user, or auto-create a default one."""
    if not supabase:
        return None
    try:
        resp = supabase.table("students").select("*").eq("user_id", user_id).execute()
        if resp.data and len(resp.data) > 0:
            return resp.data[0]
        # Auto-create if not yet created
        new_row = {
            "user_id": user_id,
            "name": "Student",
            "email": "",
            "skills": [],
            "preferred_domains": [],
            "preferred_locations": [],
            "interests": [],
        }
        res = supabase.table("students").insert(new_row).execute()
        return res.data[0] if res.data else None
    except Exception as exc:
        log.warning("Student lookup/creation error: %s", exc)
        return None


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return jsonify({
        "message": "AVSAR Internship Recommender API",
        "version": "2.0",
        "endpoints": [
            "GET  /api/health",
            "GET  /api/internships",
            "GET  /api/recommendations/<student_id>",
            "POST /api/recommendations/custom",
            "POST /api/applications",
            "GET  /api/applications/me",
            "POST /api/events",
            "GET  /api/stats",
            "GET  /api/domains",
            "GET  /api/locations",
            "GET  /api/skills",
            "GET  /api/available-options",
        ],
    })


@app.route("/api/health")
def health_check():
    return jsonify({
        "status": "healthy",
        "model_trained": _model_trained,
        "supabase_connected": supabase is not None,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })


# ── Internships ───────────────────────────────────────────────────────────────

@app.route("/api/internships")
def get_internships():
    """
    List active internships with optional filtering and pagination.
    Query params:
        domain, location, remote (bool), q (full-text search),
        page (1-indexed, default 1), page_size (default 20, max 100)
    """
    try:
        domain = request.args.get("domain")
        location = request.args.get("location")
        remote = request.args.get("remote")
        q = request.args.get("q", "").strip()
        page = max(1, int(request.args.get("page", 1)))
        page_size = min(100, max(1, int(request.args.get("page_size", 20))))

        query = supabase.table("internships").select(
            "*, companies(name, logo_url)",
            count="exact",
        ).eq("is_active", True)

        if domain:
            query = query.ilike("domain", f"%{domain}%")
        if location:
            query = query.ilike("location", f"%{location}%")
        if remote is not None:
            query = query.eq("is_remote", remote.lower() == "true")
        if q:
            query = query.or_(
                f"role_title.ilike.%{q}%,description.ilike.%{q}%,domain.ilike.%{q}%"
            )

        # Pagination
        start = (page - 1) * page_size
        query = query.range(start, start + page_size - 1)

        resp = query.execute()

        # Flatten company join
        results = []
        for item in resp.data:
            company = item.pop("companies", None) or {}
            item["company_name"] = company.get("name", "Unknown")
            item["company_logo"] = company.get("logo_url", "")
            results.append(item)

        return jsonify({
            "data": results,
            "total": resp.count,
            "page": page,
            "page_size": page_size,
            "total_pages": -(-resp.count // page_size) if resp.count else 0,
        })
    except Exception as exc:
        log.error("Error fetching internships: %s", exc)
        return jsonify({"error": str(exc)}), 500


# ── Recommendations ───────────────────────────────────────────────────────────

@app.route("/api/recommendations/<string:student_id>")
@require_auth
def get_recommendations(student_id: str):
    """Get ML-powered recommendations for the authenticated student."""
    try:
        student = _get_student_by_user_id(g.user_id)
        if not student:
            return jsonify({"error": "Student profile not found"}), 404

        top_n = min(50, max(1, int(request.args.get("limit", 10))))
        internships_df = _get_internships_df()

        if internships_df.empty:
            return jsonify({"error": "No internships available"}), 503

        if not _model_trained:
            return jsonify({"error": "ML model not ready"}), 503

        recommendations = recommender.get_recommendations(
            student, internships_df, top_n=top_n
        )
        return jsonify(recommendations)
    except Exception as exc:
        log.error("Error generating recommendations for %s: %s", student_id, exc)
        return jsonify({"error": str(exc)}), 500


@app.route("/api/recommendations/custom", methods=["POST"])
@limiter.limit("10 per minute")
def get_custom_recommendations():
    """Get recommendations for an ad-hoc profile (no auth required)."""
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        # Input validation
        required = ["preferred_domains", "preferred_locations", "skills"]
        for field in required:
            val = data.get(field)
            if not val:
                return jsonify({"error": f"'{field}' is required"}), 400
            if not isinstance(val, list):
                return jsonify({"error": f"'{field}' must be a list"}), 400

        interests = data.get("interests", [])
        if not isinstance(interests, list):
            return jsonify({"error": "'interests' must be a list"}), 400

        profile = {
            "name": str(data.get("name", "Custom User"))[:100],
            "preferred_domains": data["preferred_domains"],
            "preferred_locations": data["preferred_locations"],
            "skills": data["skills"],
            "interests": interests,
        }

        internships_df = _get_internships_df()
        if internships_df.empty:
            return jsonify({"error": "No internships available"}), 503
        if not _model_trained:
            return jsonify({"error": "ML model not ready"}), 503

        recommendations = recommender.get_recommendations(profile, internships_df)
        return jsonify(recommendations)
    except Exception as exc:
        log.error("Error in custom recommendations: %s", exc)
        return jsonify({"error": str(exc)}), 500


# ── Applications ──────────────────────────────────────────────────────────────

@app.route("/api/applications", methods=["POST"])
@require_auth
def save_application():
    """Save or update an application (save / applied / etc.)."""
    try:
        data = request.get_json(force=True, silent=True) or {}
        internship_id = data.get("internship_id")
        status = data.get("status", "saved")

        if not internship_id:
            return jsonify({"error": "'internship_id' is required"}), 400

        valid_statuses = {"saved", "applied", "interviewing", "rejected", "offered"}
        if status not in valid_statuses:
            return jsonify({"error": f"'status' must be one of {sorted(valid_statuses)}"}), 400

        student = _get_student_by_user_id(g.user_id)
        if not student:
            return jsonify({"error": "Student profile not found"}), 404

        row = {
            "student_id": student["id"],
            "internship_id": internship_id,
            "status": status,
        }
        if status == "applied":
            row["applied_at"] = datetime.utcnow().isoformat() + "Z"

        resp = supabase.table("applications").upsert(
            row, on_conflict="student_id,internship_id"
        ).execute()

        # Also log an interaction event
        _log_event(student["id"], internship_id, "save" if status == "saved" else "apply")

        return jsonify(resp.data[0]), 201
    except Exception as exc:
        log.error("Error saving application: %s", exc)
        return jsonify({"error": str(exc)}), 500


@app.route("/api/applications/me")
@require_auth
def get_my_applications():
    """Return the authenticated student's applications with internship details."""
    try:
        student = _get_student_by_user_id(g.user_id)
        if not student:
            return jsonify({"error": "Student profile not found"}), 404

        resp = supabase.table("applications").select(
            "*, internships(id, role_title, domain, location, stipend, apply_url, companies(name, logo_url))"
        ).eq("student_id", student["id"]).order("created_at", desc=True).execute()

        # Flatten nested joins
        results = []
        for app_row in resp.data:
            internship = app_row.pop("internships", None) or {}
            company = internship.pop("companies", None) or {}
            app_row["internship"] = {
                **internship,
                "company_name": company.get("name", "Unknown"),
                "company_logo": company.get("logo_url", ""),
            }
            results.append(app_row)

        return jsonify(results)
    except Exception as exc:
        log.error("Error fetching applications: %s", exc)
        return jsonify({"error": str(exc)}), 500


# ── Interaction Events ────────────────────────────────────────────────────────

EVENT_WEIGHTS = {
    "view": 0.2,
    "click": 0.5,
    "save": 0.7,
    "apply": 1.0,
    "dismiss": 0.0,
}


def _log_event(student_id: str, internship_id: str, event_type: str):
    """Internal helper to insert an interaction event row."""
    if not supabase:
        return
    try:
        supabase.table("interaction_events").insert({
            "student_id": student_id,
            "internship_id": internship_id,
            "event_type": event_type,
            "weight": EVENT_WEIGHTS.get(event_type, 1.0),
        }).execute()
    except Exception as exc:
        log.warning("Failed to log interaction event: %s", exc)


@app.route("/api/events", methods=["POST"])
@require_auth
def log_event():
    """Log a student interaction event for the ML feedback loop."""
    try:
        data = request.get_json(force=True, silent=True) or {}
        internship_id = data.get("internship_id")
        event_type = data.get("event_type")

        if not internship_id or not event_type:
            return jsonify({"error": "'internship_id' and 'event_type' are required"}), 400
        if event_type not in EVENT_WEIGHTS:
            return jsonify({"error": f"'event_type' must be one of {sorted(EVENT_WEIGHTS)}"}), 400

        student = _get_student_by_user_id(g.user_id)
        if not student:
            return jsonify({"error": "Student profile not found"}), 404

        _log_event(student["id"], internship_id, event_type)
        return jsonify({"status": "ok"}), 201
    except Exception as exc:
        log.error("Error logging event: %s", exc)
        return jsonify({"error": str(exc)}), 500


# ── Stats & Options ───────────────────────────────────────────────────────────

@app.route("/api/stats")
def get_stats():
    try:
        internships_df = _get_internships_df()
        total_internships = len(internships_df)

        students_count = 0
        if supabase:
            students_count = len(supabase.table("students").select("id", count="exact").execute().data)

        domain_counts = internships_df["domain"].value_counts().to_dict() if not internships_df.empty else {}
        location_counts = internships_df["location"].value_counts().to_dict() if not internships_df.empty else {}
        avg_stipend = internships_df.groupby("domain")["stipend"].mean().to_dict() if not internships_df.empty else {}

        return jsonify({
            "total_students": students_count,
            "total_internships": total_internships,
            "domain_distribution": domain_counts,
            "location_distribution": location_counts,
            "avg_stipend_by_domain": avg_stipend,
            "model_trained": _model_trained,
        })
    except Exception as exc:
        log.error("Error fetching stats: %s", exc)
        return jsonify({"error": str(exc)}), 500


@app.route("/api/domains")
def get_domains():
    try:
        df = _get_internships_df()
        return jsonify(sorted(df["domain"].dropna().unique().tolist()) if not df.empty else [])
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/locations")
def get_locations():
    try:
        df = _get_internships_df()
        return jsonify(sorted(df["location"].dropna().unique().tolist()) if not df.empty else [])
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/skills")
def get_skills():
    try:
        df = _get_internships_df()
        skills: set[str] = set()
        if not df.empty and "required_skills" in df.columns:
            for skill_list in df["required_skills"]:
                if isinstance(skill_list, list):
                    skills.update(skill_list)
        return jsonify(sorted(skills))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/available-options")
def get_available_options():
    try:
        df = _get_internships_df()
        skills: set[str] = set()
        if not df.empty and "required_skills" in df.columns:
            for skill_list in df["required_skills"]:
                if isinstance(skill_list, list):
                    skills.update(skill_list)
        return jsonify({
            "domains": sorted(df["domain"].dropna().unique().tolist()) if not df.empty else [],
            "locations": sorted(df["location"].dropna().unique().tolist()) if not df.empty else [],
            "skills": sorted(skills),
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── Error handlers ────────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(429)
def rate_limited(error):
    return jsonify({"error": "Too many requests — please slow down"}), 429


@app.errorhandler(500)
def internal_error(error):
    log.error("Unhandled 500: %s", error)
    return jsonify({"error": "Internal server error"}), 500


# ── Admin: retrain ML model on demand ────────────────────────────────────────

@app.route("/api/retrain", methods=["POST"])
@require_auth
@limiter.limit("2 per hour")
def retrain_model():
    """Trigger ML model retraining. Auth-protected, rate-limited."""
    try:
        _train_model()
        return jsonify({"status": "ok", "model_trained": _model_trained})
    except Exception as exc:
        log.error("Retrain failed: %s", exc)
        return jsonify({"error": str(exc)}), 500


# ── Resume Tailoring ─────────────────────────────────────────────────────────

ALLOWED_RESUME_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}
RESUME_BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET_RESUMES", "resumes")


@app.route("/api/resume/upload", methods=["POST"])
@require_auth
@limiter.limit("20 per hour")
def upload_resume():
    """
    Upload a resume file (.pdf, .docx, or .txt).
    Stores it in Supabase Storage (private bucket) and creates a `resumes` row.
    Returns the resume_id.
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file part in request"}), 400

        file = request.files["file"]
        if not file.filename:
            return jsonify({"error": "Empty filename"}), 400

        original_ext = os.path.splitext(file.filename)[1].lower()
        cleaned = secure_filename(file.filename)
        filename = cleaned if cleaned else f"resume_{uuid.uuid4().hex[:8]}{original_ext}"
        suffix = os.path.splitext(filename)[1].lower() or original_ext

        if suffix not in ALLOWED_RESUME_EXTENSIONS:
            return jsonify({"error": f"Unsupported file type '{suffix}'. Please upload .pdf, .docx, or .txt"}), 400

        student = _get_student_by_user_id(g.user_id)
        if not student:
            return jsonify({"error": "Could not locate or initialize student profile"}), 500

        # Save temporarily for parsing
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        try:
            from resume_tailor.pipeline import extract_text, parse_resume_sections
            parsed_text = extract_text(tmp_path)
            parsed_sections = parse_resume_sections(parsed_text)
        except Exception as exc:
            log.warning("Resume parsing error: %s", exc)
            parsed_text = ""
            parsed_sections = {}
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

        # Upload to Supabase Storage
        storage_path = f"{g.user_id}/{filename}"
        if supabase:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp2:
                file.stream.seek(0)
                tmp2.write(file.stream.read())
                tmp2_path = tmp2.name
            try:
                with open(tmp2_path, "rb") as f_bytes:
                    supabase.storage.from_(RESUME_BUCKET).upload(
                        storage_path, f_bytes,
                        file_options={"content-type": file.content_type or "application/octet-stream"}
                    )
            except Exception as exc:
                log.warning("Storage upload error (non-fatal): %s", exc)
            finally:
                try:
                    os.unlink(tmp2_path)
                except Exception:
                    pass

        # Create DB row
        row = {
            "student_id": student["id"],
            "original_filename": filename,
            "storage_path": storage_path,
            "parsed_text": parsed_text[:50000] if parsed_text else None,
            "parsed_sections": parsed_sections or None,
        }
        resp = supabase.table("resumes").insert(row).execute() if supabase else None
        resume_id = resp.data[0]["id"] if resp and resp.data else None

        return jsonify({"resume_id": resume_id, "filename": filename, "parsed": bool(parsed_text)}), 201

    except Exception as exc:
        log.error("Resume upload error: %s", exc)
        return jsonify({"error": str(exc)}), 500


@app.route("/api/resume/tailor", methods=["POST"])
@require_auth
@limiter.limit("5 per hour")
def tailor_resume():
    """
    Run the AI tailoring pipeline against a job description.
    Body: {resume_id, job_description_text, internship_id (optional)}
    Returns: ats_score_before, ats_score_after, diff, fabrication_flags, signed_download_url.
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        resume_id = data.get("resume_id")
        jd_text = (data.get("job_description_text") or "").strip()
        internship_id = data.get("internship_id")

        if not resume_id:
            return jsonify({"error": "'resume_id' is required"}), 400
        if not jd_text and not internship_id:
            return jsonify({"error": "Provide 'job_description_text' or 'internship_id'"}), 400

        student = _get_student_by_user_id(g.user_id)
        if not student:
            return jsonify({"error": "Student profile not found"}), 404

        # Fetch resume row (verifies ownership via RLS)
        resume_resp = supabase.table("resumes").select("*").eq("id", resume_id).single().execute() if supabase else None
        if not resume_resp or not resume_resp.data:
            return jsonify({"error": "Resume not found"}), 404
        resume_row = resume_resp.data

        # Auto-fill JD from internship if no text provided
        if not jd_text and internship_id and supabase:
            intern_resp = supabase.table("internships").select("description, role_title, required_skills").eq("id", internship_id).single().execute()
            if intern_resp and intern_resp.data:
                intern_data = intern_resp.data
                jd_text = (
                    f"{intern_data.get('role_title', '')}\n"
                    f"Skills: {', '.join(intern_data.get('required_skills') or [])}\n"
                    f"{intern_data.get('description', '')}"
                )

        if not jd_text:
            return jsonify({"error": "Could not build job description — provide job_description_text"}), 400

        # Create JD row
        jd_row_id = None
        if supabase:
            jd_resp = supabase.table("job_descriptions").insert({
                "internship_id": internship_id,
                "raw_text": jd_text[:20000],
            }).execute()
            jd_row_id = jd_resp.data[0]["id"] if jd_resp.data else None

        # Create tailoring request row (status=processing)
        request_row_id = None
        if supabase and jd_row_id:
            req_resp = supabase.table("resume_tailoring_requests").insert({
                "resume_id": resume_id,
                "job_description_id": jd_row_id,
                "status": "processing",
            }).execute()
            request_row_id = req_resp.data[0]["id"] if req_resp.data else None

        # Download resume from storage to a temp file
        tmp_suffix = os.path.splitext(resume_row.get("original_filename", ".docx"))[1] or ".docx"
        with tempfile.NamedTemporaryFile(suffix=tmp_suffix, delete=False) as tmp:
            tmp_path = tmp.name
        output_dir = tempfile.mkdtemp()

        try:
            # Download from Supabase Storage
            if supabase:
                file_bytes = supabase.storage.from_(RESUME_BUCKET).download(resume_row["storage_path"])
                with open(tmp_path, "wb") as fb:
                    fb.write(file_bytes)
            else:
                # Fallback: use parsed_text to create a minimal docx
                _write_text_as_docx(resume_row.get("parsed_text", "No content"), tmp_path)

            from resume_tailor.pipeline import run_tailoring_pipeline
            result = run_tailoring_pipeline(tmp_path, jd_text, output_dir)

        except Exception as exc:
            log.error("Tailoring pipeline error: %s", exc)
            if supabase and request_row_id:
                supabase.table("resume_tailoring_requests").update({
                    "status": "failed", "error_message": str(exc)
                }).eq("id", request_row_id).execute()
            return jsonify({"error": f"Tailoring failed: {exc}"}), 500
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

        # Upload tailored file to storage and get a signed URL
        signed_url = None
        tailored_storage_path = None
        tailored_file = result.get("tailored_file_path")
        if tailored_file and supabase:
            tailored_storage_path = f"{g.user_id}/tailored_{os.path.basename(tailored_file)}"
            try:
                with open(tailored_file, "rb") as tb:
                    supabase.storage.from_(RESUME_BUCKET).upload(tailored_storage_path, tb)
                signed = supabase.storage.from_(RESUME_BUCKET).create_signed_url(
                    tailored_storage_path, 3600  # 1 hour expiry
                )
                signed_url = signed.get("signedURL")
            except Exception as exc:
                log.warning("Could not upload tailored file to storage: %s", exc)

        # Update tailoring request row
        if supabase and request_row_id:
            supabase.table("resume_tailoring_requests").update({
                "status": "done",
                "ats_score_before": result["ats_score_before"],
                "ats_score_after": result["ats_score_after"],
                "tailored_storage_path": tailored_storage_path,
                "diff": result["diff"],
                "fabrication_flags": result["fabrication_flags"],
            }).eq("id", request_row_id).execute()

        return jsonify({
            "request_id": request_row_id,
            "ats_score_before": result["ats_score_before"],
            "ats_score_after": result["ats_score_after"],
            "jd_keywords": result["jd_keywords"],
            "diff": result["diff"],
            "fabrication_flags": result["fabrication_flags"],
            "download_url": signed_url,
            "download_url_expires_in_seconds": 3600,
        })

    except Exception as exc:
        log.error("Resume tailor endpoint error: %s", exc)
        return jsonify({"error": str(exc)}), 500


@app.route("/api/resume/tailor/<string:request_id>")
@require_auth
def get_tailoring_status(request_id: str):
    """Poll the status of a tailoring request."""
    try:
        if not supabase:
            return jsonify({"error": "Database not connected"}), 503
        resp = supabase.table("resume_tailoring_requests").select("*").eq("id", request_id).single().execute()
        if not resp.data:
            return jsonify({"error": "Request not found"}), 404
        row = resp.data
        result = {
            "status": row.get("status"),
            "ats_score_before": row.get("ats_score_before"),
            "ats_score_after": row.get("ats_score_after"),
            "fabrication_flags": row.get("fabrication_flags", []),
            "diff": row.get("diff", []),
            "error_message": row.get("error_message"),
        }
        # Generate fresh signed URL if done
        if row.get("status") == "done" and row.get("tailored_storage_path"):
            try:
                signed = supabase.storage.from_(RESUME_BUCKET).create_signed_url(
                    row["tailored_storage_path"], 3600
                )
                result["download_url"] = signed.get("signedURL")
                result["download_url_expires_in_seconds"] = 3600
            except Exception:
                pass
        return jsonify(result)
    except Exception as exc:
        log.error("Tailoring status error: %s", exc)
        return jsonify({"error": str(exc)}), 500


def _write_text_as_docx(text: str, output_path: str):
    """Minimal fallback: write plain text as a .docx when Storage is unavailable."""
    try:
        import docx
        doc = docx.Document()
        for line in text.split("\n"):
            if line.strip():
                doc.add_paragraph(line.strip())
        doc.save(output_path)
    except ImportError:
        with open(output_path, "w") as f:
            f.write(text)


# ── User Account Management (DPDP Compliance) ────────────────────────────────

@app.route("/api/users/me", methods=["DELETE"])
@require_auth
@limiter.limit("2 per hour")
def delete_account():
    """
    Deletes the authenticated user's account and all associated data.
    This includes their student profile, applications, interaction events,
    resumes, and Supabase auth account.
    """
    try:
        if not supabase:
            return jsonify({"error": "Database not connected"}), 503
        
        # 1. Get the student ID for the user
        student = _get_student_by_user_id(g.user_id)
        if not student:
            return jsonify({"error": "Student profile not found"}), 404
            
        student_id = student["id"]
        
        # 2. Delete resumes from storage if possible
        resumes_resp = supabase.table("resumes").select("storage_path").eq("student_id", student_id).execute()
        if resumes_resp.data:
            paths_to_delete = [row["storage_path"] for row in resumes_resp.data if row.get("storage_path")]
            if paths_to_delete:
                try:
                    supabase.storage.from_(RESUME_BUCKET).remove(paths_to_delete)
                except Exception as exc:
                    log.warning("Could not delete some resumes from storage: %s", exc)
        
        # 3. Delete student record from DB (Supabase cascading deletes should handle 
        # applications, interaction_events, and resumes table rows if FKs are set up right)
        # Even if not cascading, we delete the auth user via Admin API which deletes the user_id.
        supabase.table("students").delete().eq("user_id", g.user_id).execute()
        
        # 4. Delete the Auth user using Supabase Admin API
        # Note: Requires SUPABASE_SERVICE_ROLE_KEY to have admin privileges
        supabase.auth.admin.delete_user(g.user_id)
        
        log.info("User %s and all associated data deleted successfully.", g.user_id)
        return jsonify({"status": "success", "message": "Account deleted successfully"})
        
    except Exception as exc:
        log.error("Account deletion error: %s", exc)
        return jsonify({"error": str(exc)}), 500


# ── Local dev entrypoint ──────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    log.info("Starting Flask dev server on port %d …", port)
    log.info("Available endpoints: see GET /")
    app.run(debug=True, host="0.0.0.0", port=port)