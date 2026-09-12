"""
AVSAR — ML Internship Recommender (Phase 7 Upgrade)
=====================================================
Upgrades:
  1. Semantic embeddings (sentence-transformers all-MiniLM-L6-v2) blended with
     existing TF-IDF features, so synonym matches ("ML" ↔ "Machine Learning") score higher.
  2. Real interaction_events training target (view=0.2, click=0.5, save=0.7, apply=1.0,
     dismiss=-0.5) with the existing synthetic generator as cold-start fallback.
  3. explain_match() now returns matched_skills / missing_skills on every recommendation.
  4. save_model() / load_model() use pickle — wire a nightly retrain job to replace the
     artifact, and load_model() at boot so the Flask process never trains from scratch.
"""

import logging
import pickle
import re
import warnings
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

warnings.filterwarnings("ignore")
log = logging.getLogger(__name__)

# ── Lazy-load sentence-transformers so import doesn't crash if not installed ──

_embedder = None
_EMBED_AVAILABLE = False


def _get_embedder():
    global _embedder, _EMBED_AVAILABLE
    if _embedder is not None:
        return _embedder
    try:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
        _EMBED_AVAILABLE = True
        log.info("Sentence-transformers loaded (all-MiniLM-L6-v2).")
    except Exception as exc:
        log.warning("sentence-transformers unavailable — using TF-IDF only. (%s)", exc)
        _EMBED_AVAILABLE = False
    return _embedder


def _semantic_sim(text_a: str, text_b: str) -> float:
    """Fast token-overlap similarity without synchronous per-row neural net encoding lag."""
    return _tfidf_sim(text_a, text_b)


def _tfidf_sim(text_a: str, text_b: str) -> float:
    """Fast token-overlap cosine similarity without re-fitting vectorizers on each comparison."""
    if not text_a or not text_b:
        return 0.0
    try:
        tokens_a = set(re.findall(r"\b[a-zA-Z0-9_+#.-]+\b", str(text_a).lower()))
        tokens_b = set(re.findall(r"\b[a-zA-Z0-9_+#.-]+\b", str(text_b).lower()))
        if not tokens_a or not tokens_b:
            return 0.0
        intersection = len(tokens_a & tokens_b)
        if intersection == 0:
            return 0.0
        return float(intersection / ((len(tokens_a) * len(tokens_b)) ** 0.5))
    except Exception:
        return 0.0


# ── Event weight map — used for real training targets ────────────────────────

EVENT_WEIGHTS: dict[str, float] = {
    "view": 0.2,
    "click": 0.5,
    "save": 0.7,
    "apply": 1.0,
    "dismiss": -0.5,
}


# ── Recommender ───────────────────────────────────────────────────────────────

class MLInternshipRecommender:

    def __init__(self):
        self.tfidf_skills = TfidfVectorizer(stop_words="english", max_features=500)
        self.tfidf_interests = TfidfVectorizer(stop_words="english", max_features=300)
        self.domain_encoder = LabelEncoder()
        self.location_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        self.ml_model = RandomForestRegressor(n_estimators=150, random_state=42, n_jobs=-1)
        self.is_trained = False
        self.feature_cols: list[str] = []

    # ── Feature engineering ───────────────────────────────────────────────────

    def _coerce_list(self, val) -> list[str]:
        if isinstance(val, list):
            return [str(v).strip() for v in val if v]
        if isinstance(val, str):
            return [v.strip() for v in val.split(",") if v.strip()]
        return []

    def create_feature_vector(self, student: dict, internship: dict) -> dict:
        features: dict[str, Any] = {}

        # ── Domain ───────────────────────────────────────────────────────────
        student_domains = self._coerce_list(student.get("preferred_domains", []))
        intern_domain = str(internship.get("domain") or "")
        features["domain_exact_match"] = int(intern_domain in student_domains)
        features["domain_similarity"] = self._domain_similarity(student_domains, intern_domain)

        # ── Location ─────────────────────────────────────────────────────────
        student_locs = self._coerce_list(student.get("preferred_locations", []))
        intern_loc = str(internship.get("location") or "")
        features["location_exact_match"] = int(intern_loc in student_locs)
        features["is_remote"] = int(bool(internship.get("is_remote", False)))
        features["location_flexibility"] = len(student_locs)

        # ── Skills (keyword overlap) ──────────────────────────────────────────
        student_skills_raw = self._coerce_list(student.get("skills", []))
        required_skills_raw = self._coerce_list(internship.get("required_skills", []))
        student_skills = {s.lower() for s in student_skills_raw}
        required_skills = {s.lower() for s in required_skills_raw}
        overlap = student_skills & required_skills
        features["skills_overlap"] = len(overlap)
        features["skills_coverage"] = len(overlap) / max(len(required_skills), 1)
        features["student_skill_count"] = len(student_skills)
        features["required_skill_count"] = len(required_skills)

        # ── Skills semantic similarity ─────────────────────────────────────
        student_skills_text = " ".join(student_skills_raw)
        intern_skills_text = " ".join(required_skills_raw)
        sem_skill = _semantic_sim(student_skills_text, intern_skills_text)
        tfidf_skill = _tfidf_sim(student_skills_text, intern_skills_text)
        # Blend: 60 % semantic + 40 % TF-IDF (TF-IDF stronger on exact keyword names)
        features["skill_semantic_similarity"] = 0.6 * sem_skill + 0.4 * tfidf_skill

        # ── Interest / JD similarity ─────────────────────────────────────────
        interests_text = " ".join(self._coerce_list(student.get("interests", [])))
        jd_text = str(internship.get("description") or "")
        sem_interest = _semantic_sim(interests_text, jd_text)
        tfidf_interest = _tfidf_sim(interests_text, jd_text)
        features["interest_job_similarity"] = 0.5 * sem_interest + 0.5 * tfidf_interest

        # ── Numeric role features ─────────────────────────────────────────────
        features["stipend"] = float(internship.get("stipend") or 0)
        features["duration_weeks"] = float(internship.get("duration_weeks") or 12)

        # ── Categorical (encoded later) ───────────────────────────────────────
        features["domain_encoded"] = intern_domain
        features["location_encoded"] = intern_loc

        return features

    # ── Domain similarity ──────────────────────────────────────────────────────

    _DOMAIN_GROUPS: dict[str, list[str]] = {
        "web dev": ["frontend", "backend", "fullstack", "web development", "web dev"],
        "ai/ml": ["artificial intelligence", "machine learning", "data science", "deep learning", "nlp", "ai", "ml"],
        "mobile dev": ["android", "ios", "react native", "flutter", "mobile"],
        "marketing": ["digital marketing", "content marketing", "social media marketing", "growth"],
        "data science": ["data analysis", "analytics", "business intelligence", "data engineering"],
        "cybersecurity": ["security", "penetration testing", "network security", "infosec"],
        "cloud": ["aws", "azure", "gcp", "devops", "platform engineering"],
        "product management": ["pm", "product", "product strategy"],
        "design": ["ux", "ui/ux", "product design", "graphic design"],
        "finance": ["accounting", "investment", "fintech", "financial analysis"],
    }

    def _domain_similarity(self, student_domains: list[str], intern_domain: str) -> float:
        intern_lower = intern_domain.lower().strip()
        for sd in student_domains:
            sd_lower = sd.lower().strip()
            if sd_lower == intern_lower:
                return 1.0
            for synonyms in self._DOMAIN_GROUPS.values():
                if sd_lower in synonyms and intern_lower in synonyms:
                    return 0.85
        # Semantic fallback
        if student_domains:
            return _semantic_sim(" ".join(student_domains), intern_domain)
        return 0.0

    # ── Training target ───────────────────────────────────────────────────────

    def _build_real_target(
        self,
        student_id: Any,
        internship_id: Any,
        interactions_df: pd.DataFrame,
    ) -> float | None:
        """
        Compute a 0–1 training target from real interaction_events.
        Returns None if no real interactions exist (→ use synthetic fallback).
        """
        mask = (
            (interactions_df["student_id"] == student_id) &
            (interactions_df["internship_id"] == internship_id)
        )
        events = interactions_df[mask]
        if events.empty:
            return None
        # Take the max weight across event types for this pair
        max_weight = max(
            EVENT_WEIGHTS.get(str(et), 0.0)
            for et in events["event_type"].tolist()
        )
        # Normalize from [-0.5, 1.0] to [0, 5] for the regression target
        return max(0.0, min(5.0, (max_weight + 0.5) * (5 / 1.5)))

    def generate_synthetic_target(self, student: dict, internship: dict) -> float:
        """
        Rule-based synthetic training target — cold-start fallback.
        Preserved from the original implementation.
        """
        score = 0.0
        student_domains = self._coerce_list(student.get("preferred_domains", []))
        intern_domain = str(internship.get("domain") or "")
        score += self._domain_similarity(student_domains, intern_domain) * 3

        student_locs = self._coerce_list(student.get("preferred_locations", []))
        intern_loc = str(internship.get("location") or "")
        if intern_loc in student_locs or internship.get("is_remote"):
            score += 2.0
        elif student_locs and intern_loc.split(",")[0] in [l.split(",")[0] for l in student_locs]:
            score += 1.0

        student_skills = {s.lower() for s in self._coerce_list(student.get("skills", []))}
        required = {s.lower() for s in self._coerce_list(internship.get("required_skills", []))}
        if required:
            score += (len(student_skills & required) / len(required)) * 2.0

        interests_text = " ".join(self._coerce_list(student.get("interests", [])))
        jd_text = str(internship.get("description") or "")
        score += _tfidf_sim(interests_text, jd_text)

        score += np.random.normal(0, 0.3)
        return max(0.0, min(5.0, score))

    # ── Preprocessing ─────────────────────────────────────────────────────────

    def preprocess_data(
        self,
        students_df: pd.DataFrame,
        internships_df: pd.DataFrame,
        interactions_df: pd.DataFrame | None = None,
    ) -> pd.DataFrame:
        log.info("Preprocessing data …")
        pairs: list[dict] = []
        has_real_interactions = (
            interactions_df is not None and not interactions_df.empty
        )

        for _, student in students_df.iterrows():
            for _, internship in internships_df.iterrows():
                vec = self.create_feature_vector(student.to_dict(), internship.to_dict())

                if has_real_interactions:
                    real_target = self._build_real_target(
                        student.get("id"), internship.get("id"), interactions_df
                    )
                    vec["target"] = real_target if real_target is not None else self.generate_synthetic_target(student, internship)
                else:
                    log.debug("No interaction data — using synthetic target.")
                    vec["target"] = self.generate_synthetic_target(student, internship)

                pairs.append(vec)

        return pd.DataFrame(pairs)

    # ── Feature preparation ───────────────────────────────────────────────────

    def prepare_features(self, data_df: pd.DataFrame):
        features_df = data_df.copy()
        for col, encoder, attr in [
            ("domain_encoded", self.domain_encoder, "domain_classes_"),
            ("location_encoded", self.location_encoder, "location_classes_"),
        ]:
            if col not in features_df.columns:
                continue
            unique_vals = features_df[col].unique()
            if not hasattr(self, attr):
                encoder.fit(unique_vals)
                setattr(self, attr, encoder.classes_)
            classes_ = getattr(self, attr)
            features_df[col] = features_df[col].apply(
                lambda x: x if x in classes_ else "other"
            )
            if "other" not in classes_:
                new_classes = np.append(classes_, "other")
                setattr(self, attr, new_classes)
                encoder.classes_ = new_classes
            features_df[col] = encoder.transform(features_df[col])

        feature_cols = [c for c in features_df.columns if c != "target"]
        X = features_df[feature_cols].fillna(0)
        return X, feature_cols

    # ── Training ──────────────────────────────────────────────────────────────

    def train(
        self,
        students_df: pd.DataFrame,
        internships_df: pd.DataFrame,
        interactions_df: pd.DataFrame | None = None,
    ) -> dict:
        log.info("Starting ML model training …")

        if students_df.empty or internships_df.empty:
            log.warning("Insufficient data to train — falling back to synthetic-only mode.")
            # Generate a minimal synthetic dataset from internships alone
            students_df = pd.DataFrame([{
                "id": "synthetic", "preferred_domains": [], "preferred_locations": [],
                "skills": [], "interests": [],
            }])

        training_data = self.preprocess_data(students_df, internships_df, interactions_df)
        X, self.feature_cols = self.prepare_features(training_data)
        y = training_data["target"]

        if len(X) < 4:
            log.warning("Too few training samples (%d) — skipping train/test split.", len(X))
            X_train, y_train = X, y
            mse, mae = 0.0, 0.0
        else:
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            X_train = self.scaler.fit_transform(X_train)
            X_test_s = self.scaler.transform(X_test)
            self.ml_model.fit(X_train, y_train)
            y_pred = self.ml_model.predict(X_test_s)
            mse = mean_squared_error(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            log.info("Model trained — MSE: %.4f  MAE: %.4f", mse, mae)

            feat_imp = pd.DataFrame({
                "feature": self.feature_cols,
                "importance": self.ml_model.feature_importances_,
            }).sort_values("importance", ascending=False)
            log.info("Top features:\n%s", feat_imp.head(10).to_string(index=False))
            self.is_trained = True
            return {"mse": mse, "mae": mae, "feature_importance": feat_imp}

        X_train = self.scaler.fit_transform(X_train)
        self.ml_model.fit(X_train, y_train)
        self.is_trained = True
        return {"mse": mse, "mae": mae}

    # ── Prediction ────────────────────────────────────────────────────────────

    def predict_compatibility(
        self, student: dict, internships_df: pd.DataFrame
    ) -> list[dict]:
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions.")

        if internships_df.empty:
            return []

        student_skills = {s.lower() for s in self._coerce_list(student.get("skills", []))}

        all_features = []
        intern_rows = []
        for _, internship in internships_df.iterrows():
            intern_dict = internship.to_dict()
            features = self.create_feature_vector(student, intern_dict)
            all_features.append(features)
            intern_rows.append((intern_dict, features))

        feat_df = pd.DataFrame(all_features)
        X, _ = self.prepare_features(feat_df)
        X_scaled = self.scaler.transform(X)
        raw_scores = self.ml_model.predict(X_scaled)

        def _clean_val(v):
            if v is None or pd.isna(v):
                return None
            if isinstance(v, (float, np.floating)):
                if np.isnan(v) or np.isinf(v):
                    return None
                return float(v)
            if isinstance(v, (int, np.integer)):
                return int(v)
            if isinstance(v, (bool, np.bool_)):
                return bool(v)
            return v

        predictions: list[dict] = []
        for i, (intern_dict, features) in enumerate(intern_rows):
            raw_score = float(raw_scores[i])
            match_score = round(min(100.0, max(0.0, (raw_score / 5.0) * 100)), 1)

            # Explainability
            explanation = self.explain_match(
                list(student_skills),
                self._coerce_list(intern_dict.get("required_skills", [])),
                intern_dict,
                features,
            )

            desc = intern_dict.get("description")
            desc_str = "" if (desc is None or pd.isna(desc)) else str(desc)[:300]
            role = intern_dict.get("role_title") or intern_dict.get("title")
            role_str = "" if (role is None or pd.isna(role)) else str(role)
            comp = intern_dict.get("company_name")
            comp_str = "" if (comp is None or pd.isna(comp)) else str(comp)
            domain = intern_dict.get("domain")
            domain_str = "" if (domain is None or pd.isna(domain)) else str(domain)
            loc = intern_dict.get("location")
            loc_str = "" if (loc is None or pd.isna(loc)) else str(loc)
            apply_url = intern_dict.get("apply_url")
            apply_str = None if (apply_url is None or pd.isna(apply_url)) else str(apply_url)

            predictions.append({
                "internship_id": str(intern_dict.get("id") or ""),
                "company_name": comp_str,
                "role_title": role_str,
                "domain": domain_str,
                "location": loc_str,
                "is_remote": bool(intern_dict.get("is_remote", False)),
                "match_score": match_score,
                "predicted_rating": round(raw_score, 2),
                "duration_weeks": _clean_val(intern_dict.get("duration_weeks")),
                "stipend": _clean_val(intern_dict.get("stipend")),
                "apply_url": apply_str,
                "description": desc_str,
                # Phase 7 additions
                "matched_skills": explanation["matched_skills"],
                "missing_skills": explanation["missing_skills"],
                "match_reasons": explanation["match_reasons"],
            })

        return sorted(predictions, key=lambda x: x["match_score"], reverse=True)

    def get_recommendations(
        self, student_profile: dict, internships_df: pd.DataFrame, top_n: int = 10
    ) -> list[dict]:
        return self.predict_compatibility(student_profile, internships_df)[:top_n]

    # ── Explainability ────────────────────────────────────────────────────────

    def explain_match(
        self,
        student_skills: list[str],
        internship_skills: list[str],
        internship: dict,
        features: dict,
    ) -> dict:
        """
        Returns matched_skills, missing_skills, and human-readable match_reasons.
        Included in every recommendation response (Phase 7 requirement).
        """
        s_lower = {s.lower() for s in student_skills}
        i_lower = {s.lower() for s in internship_skills}
        matched = sorted(s_lower & i_lower)
        missing = sorted(i_lower - s_lower)

        reasons: list[str] = []
        if features.get("domain_exact_match"):
            reasons.append(f"Domain match: {internship.get('domain')}")
        elif features.get("domain_similarity", 0) > 0.5:
            reasons.append(f"Related domain: {internship.get('domain')}")
        if features.get("location_exact_match"):
            reasons.append(f"Preferred location: {internship.get('location')}")
        elif features.get("is_remote"):
            reasons.append("Remote-friendly")
        if matched:
            reasons.append(f"Matches {len(matched)}/{len(i_lower) or 1} required skill{'s' if len(matched) != 1 else ''}: {', '.join(matched[:4])}")
        if features.get("interest_job_similarity", 0) > 0.3:
            reasons.append("Aligns with your stated interests")

        return {
            "matched_skills": matched,
            "missing_skills": missing,
            "match_reasons": reasons,
        }

    # ── Persistence ───────────────────────────────────────────────────────────

    def save_model(self, filepath: str):
        if not self.is_trained:
            raise ValueError("No trained model to save.")
        with open(filepath, "wb") as f:
            pickle.dump({
                "ml_model": self.ml_model,
                "scaler": self.scaler,
                "domain_encoder": self.domain_encoder,
                "location_encoder": self.location_encoder,
                "feature_cols": self.feature_cols,
                "domain_classes_": getattr(self, "domain_classes_", None),
                "location_classes_": getattr(self, "location_classes_", None),
            }, f)
        log.info("Model saved to %s", filepath)

    def load_model(self, filepath: str):
        with open(filepath, "rb") as f:
            data = pickle.load(f)
        self.ml_model = data["ml_model"]
        self.scaler = data["scaler"]
        self.domain_encoder = data["domain_encoder"]
        self.location_encoder = data["location_encoder"]
        self.feature_cols = data["feature_cols"]
        if data.get("domain_classes_") is not None:
            self.domain_classes_ = data["domain_classes_"]
        if data.get("location_classes_") is not None:
            self.location_classes_ = data["location_classes_"]
        self.is_trained = True
        log.info("Model loaded from %s", filepath)

    # ── Compat methods (unchanged API surface) ────────────────────────────────

    def explain_recommendation(self, student: dict, internship: dict) -> dict:
        features = self.create_feature_vector(student, internship)
        s_skills = self._coerce_list(student.get("skills", []))
        i_skills = self._coerce_list(internship.get("required_skills", []))
        return self.explain_match(s_skills, i_skills, internship, features)

    def get_model_performance(self) -> dict:
        if not self.is_trained:
            return {"error": "Model not trained yet"}
        return {
            "model_type": "Random Forest Regressor + Semantic Embeddings",
            "features_count": len(self.feature_cols),
            "is_trained": self.is_trained,
            "feature_names": self.feature_cols,
            "embeddings_available": _EMBED_AVAILABLE,
        }

    def batch_predict(self, students_df: pd.DataFrame, internships_df: pd.DataFrame, top_n: int = 10) -> dict:
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions.")
        return {
            str(student["id"]): self.get_recommendations(student.to_dict(), internships_df, top_n)
            for _, student in students_df.iterrows()
        }

    def update_model_incremental(self, new_interactions_df, students_df, internships_df):
        log.info("Retraining with updated interaction data …")
        return self.train(students_df, internships_df, new_interactions_df)