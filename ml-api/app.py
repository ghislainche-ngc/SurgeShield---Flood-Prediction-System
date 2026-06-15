"""
SurgeShield — Flask API
=======================

Serves the trained flood-prediction model and the real analytics artifacts to
the rest of the stack (Convex backend -> Next.js frontend).

Endpoints
  POST /predict            11 features -> {flood, probability, risk_level, top_factors}
  GET  /model-info         best model name + real metrics (from metrics.json)
  GET  /analytics          model comparison + confusion matrix + ROC + importances
  GET  /weather?lat=&lon=  live rainfall/temp/humidity via Open-Meteo (no key)
  GET  /health             {status, model_loaded}

Design notes
  * The prediction transform is the SHARED preprocessing.py used in training, so
    the API and the model can never disagree on encoding/scaling.
  * All reported numbers are read from the real JSON artifacts. Nothing is
    hard-coded. Stage-5 files (5_interpretation/) are read when present and
    handled gracefully when not yet generated.

Run:
    python app.py                      # dev
    gunicorn app:app -b 0.0.0.0:5000   # prod
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

# --------------------------------------------------------------------------- #
# Paths + shared preprocessing import
# --------------------------------------------------------------------------- #
HERE = Path(__file__).resolve().parent
MODELING_DIR = HERE / "4_modeling"
MODELS_DIR = MODELING_DIR / "models"
INTERP_DIR = HERE / "5_interpretation"

# preprocessing.py lives in the digit-prefixed 4_modeling folder, which is not
# an importable package — add it to sys.path and import the module directly.
if str(MODELING_DIR) not in sys.path:
    sys.path.insert(0, str(MODELING_DIR))
import preprocessing as pp  # noqa: E402

# Artifact file locations.
ARTIFACTS = {
    "model": MODELS_DIR / "best_model.joblib",
    "scaler": MODELS_DIR / "scaler.joblib",
    "encoder": MODELS_DIR / "encoder.joblib",
    "comparison": MODELS_DIR / "all_models_comparison.json",
}
INTERP_FILES = {
    "metrics": INTERP_DIR / "metrics.json",
    "confusion_matrix": INTERP_DIR / "confusion_matrix.json",
    "roc_data": INTERP_DIR / "roc_data.json",
    "feature_importances": INTERP_DIR / "feature_importances.json",
}

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# Probability -> risk level thresholds (kept in sync with frontend utils).
RISK_BANDS = [
    (0.25, "Low"),
    (0.50, "Moderate"),
    (0.75, "High"),
    (1.01, "Critical"),
]

# --------------------------------------------------------------------------- #
# App + model state
# --------------------------------------------------------------------------- #
app = Flask(__name__)
CORS(app)

STATE: dict = {"model": None, "scaler": None, "encoder": None,
               "comparison": None, "load_error": None, "allowed_categories": {}}


def load_artifacts() -> None:
    """Load model + preprocessing artifacts once at startup.

    On any failure we record the error and leave the model unloaded; endpoints
    then return a clear 503 instead of crashing.
    """
    try:
        missing = [name for name, p in ARTIFACTS.items() if not p.exists()]
        if missing:
            raise FileNotFoundError(
                f"Missing artifact(s): {missing}. "
                "Run `python 4_modeling/train.py` first.")

        STATE["model"] = joblib.load(ARTIFACTS["model"])
        STATE["scaler"] = joblib.load(ARTIFACTS["scaler"])
        STATE["encoder"] = joblib.load(ARTIFACTS["encoder"])
        with open(ARTIFACTS["comparison"], encoding="utf-8") as f:
            STATE["comparison"] = json.load(f)

        # Allowed categorical values come from the fitted encoder — so /predict
        # validation matches exactly what the model was trained on.
        STATE["allowed_categories"] = {
            col: list(cats) for col, cats in
            zip(pp.CATEGORICAL_FEATURES, STATE["encoder"].categories_)
        }
        STATE["load_error"] = None
        app.logger.info("Artifacts loaded: best model = %s",
                        STATE["comparison"].get("best_model"))
    except Exception as exc:  # noqa: BLE001 - report any startup failure clearly
        STATE["load_error"] = str(exc)
        app.logger.error("Failed to load artifacts: %s", exc)


def model_ready() -> bool:
    return STATE["model"] is not None


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def error(message: str, status: int, **extra):
    """Uniform JSON error response."""
    payload = {"error": message}
    payload.update(extra)
    return jsonify(payload), status


def read_json(path: Path):
    """Read a JSON artifact, or None if it does not exist yet."""
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def risk_level(prob: float) -> str:
    for ceiling, label in RISK_BANDS:
        if prob < ceiling:
            return label
    return "Critical"


def validate_features(body: dict):
    """Validate + coerce an incoming /predict body into a one-row DataFrame.

    Returns (DataFrame, None) on success or (None, (msg, details)) on failure.
    """
    if not isinstance(body, dict):
        return None, ("Request body must be a JSON object.", {})

    missing = [c for c in pp.FEATURE_COLUMNS if c not in body]
    if missing:
        return None, ("Missing required feature(s).",
                      {"missing": missing, "required": pp.FEATURE_COLUMNS})

    row, bad = {}, {}

    # Numeric features -> float.
    for col in pp.NUMERIC_FEATURES:
        try:
            row[col] = float(body[col])
        except (TypeError, ValueError):
            bad[col] = "expected a number"

    # Binary features -> 0/1.
    for col in pp.BINARY_FEATURES:
        try:
            v = int(body[col])
            if v not in (0, 1):
                bad[col] = "expected 0 or 1"
            else:
                row[col] = v
        except (TypeError, ValueError):
            bad[col] = "expected 0 or 1"

    # Categorical features -> must be one of the trained categories.
    for col in pp.CATEGORICAL_FEATURES:
        val = body[col]
        allowed = STATE["allowed_categories"].get(col, [])
        if val not in allowed:
            bad[col] = f"expected one of {allowed}"
        else:
            row[col] = val

    if bad:
        return None, ("Invalid feature value(s).", {"invalid": bad})

    return pd.DataFrame([row], columns=pp.FEATURE_COLUMNS), None


def _encoded_to_original() -> list[str]:
    """Map each encoded column back to its original feature name.

    Encoded order (from preprocessing): numeric | binary | one-hot categoricals.
    A one-hot column like 'Land Cover_Urban' maps back to 'Land Cover'.
    """
    names = pp.get_feature_names(STATE["encoder"])
    mapping = []
    for n in names:
        parent = next((c for c in pp.CATEGORICAL_FEATURES if n.startswith(c + "_")), n)
        mapping.append(parent)
    return mapping


def top_factors(x_vec: np.ndarray, k: int = 3) -> list[dict]:
    """Local contribution of each ORIGINAL feature to this prediction.

    * Linear model (coef_): signed contribution = coef * standardized value
      (the logit decomposition) — directional and exact.
    * Tree model (feature_importances_): salience = importance * |value|
      (global importance has no per-sample sign).
    One-hot contributions are summed back into their parent categorical feature.
    Returns the top-k features by magnitude.
    """
    model = STATE["model"]
    x_vec = np.asarray(x_vec, dtype=float).ravel()

    if hasattr(model, "coef_"):
        contrib = model.coef_.ravel() * x_vec
    elif hasattr(model, "feature_importances_"):
        contrib = np.asarray(model.feature_importances_, dtype=float) * np.abs(x_vec)
    else:
        return []

    # Aggregate encoded contributions to original feature names.
    parents = _encoded_to_original()
    agg: dict[str, float] = {}
    for parent, val in zip(parents, contrib):
        agg[parent] = agg.get(parent, 0.0) + float(val)

    ranked = sorted(agg.items(), key=lambda kv: abs(kv[1]), reverse=True)[:k]
    return [
        {
            "feature": feat,
            "contribution": round(val, 4),
            "direction": "increases" if val >= 0 else "decreases",
        }
        for feat, val in ranked
    ]


# --------------------------------------------------------------------------- #
# Endpoints
# --------------------------------------------------------------------------- #
@app.get("/health")
def health():
    return jsonify({
        "status": "ok" if model_ready() else "degraded",
        "model_loaded": model_ready(),
        "load_error": STATE["load_error"],
    })


@app.post("/predict")
def predict():
    if not model_ready():
        return error("Model not loaded.", 503, load_error=STATE["load_error"])

    body = request.get_json(silent=True)
    if body is None:
        return error("Request body must be valid JSON.", 400)

    X, verr = validate_features(body)
    if verr is not None:
        msg, details = verr
        return error(msg, 422, **details)

    try:
        x_t = pp.transform_features(X, STATE["scaler"], STATE["encoder"])
        prob = float(STATE["model"].predict_proba(x_t)[:, 1][0])
        flood = bool(STATE["model"].predict(x_t)[0])
        return jsonify({
            "flood": flood,
            "probability": round(prob, 4),
            "risk_level": risk_level(prob),
            "top_factors": top_factors(x_t),
            "model": STATE["comparison"].get("best_model"),
        })
    except Exception as exc:  # noqa: BLE001
        app.logger.exception("Prediction failed")
        return error("Prediction failed.", 500, detail=str(exc))


@app.get("/model-info")
def model_info():
    if not model_ready():
        return error("Model not loaded.", 503, load_error=STATE["load_error"])

    # Preferred source: the stage-5 metrics.json single source of truth.
    metrics = read_json(INTERP_FILES["metrics"])
    if metrics is not None:
        return jsonify({"source": "metrics.json", **metrics})

    # Fallback (stage 5 not generated yet): derive from the comparison JSON.
    comp = STATE["comparison"]
    best = comp.get("best_model")
    test = comp.get("models", {}).get(best, {}).get("test", {})
    return jsonify({
        "source": "all_models_comparison.json (interpret.py not run yet)",
        "best_model": best,
        "metrics": test,
        "feature_count": comp.get("feature_count_raw"),
        "feature_count_encoded": comp.get("feature_count_encoded"),
        "trained_at": comp.get("generated_at"),
    })


@app.get("/analytics")
def analytics():
    if STATE["comparison"] is None:
        return error("Analytics unavailable: comparison artifact not loaded.",
                     503, load_error=STATE["load_error"])

    warnings = []
    payload = {"model_comparison": STATE["comparison"]}
    for key, path in INTERP_FILES.items():
        data = read_json(path)
        payload[key] = data
        if data is None:
            warnings.append(f"{path.name} not found (run interpret.py)")

    if warnings:
        payload["warnings"] = warnings
    return jsonify(payload)


@app.get("/weather")
def weather():
    lat, lon = request.args.get("lat"), request.args.get("lon")
    if lat is None or lon is None:
        return error("Query params 'lat' and 'lon' are required.", 400)
    try:
        lat_f, lon_f = float(lat), float(lon)
    except ValueError:
        return error("'lat' and 'lon' must be numbers.", 400)
    if not (-90 <= lat_f <= 90) or not (-180 <= lon_f <= 180):
        return error("'lat' must be in [-90, 90] and 'lon' in [-180, 180].", 400)

    try:
        resp = requests.get(
            OPEN_METEO_URL,
            params={
                "latitude": lat_f,
                "longitude": lon_f,
                "current": "temperature_2m,relative_humidity_2m,rain,precipitation",
            },
            timeout=10,
        )
        resp.raise_for_status()
        cur = resp.json().get("current", {})
    except requests.Timeout:
        return error("Weather provider timed out.", 504)
    except requests.RequestException as exc:
        return error("Failed to reach weather provider.", 502, detail=str(exc))

    # Map Open-Meteo fields to the three model inputs it can supply.
    rainfall = cur.get("rain")
    if rainfall is None:
        rainfall = cur.get("precipitation")
    return jsonify({
        "latitude": lat_f,
        "longitude": lon_f,
        "rainfall": rainfall,                       # mm
        "temperature": cur.get("temperature_2m"),   # °C
        "humidity": cur.get("relative_humidity_2m"),  # %
        "source": "open-meteo",
        "fetched_at": cur.get("time"),
    })


# --------------------------------------------------------------------------- #
# Generic error handlers
# --------------------------------------------------------------------------- #
@app.errorhandler(404)
def not_found(_):
    return error("Endpoint not found.", 404)


@app.errorhandler(405)
def method_not_allowed(_):
    return error("Method not allowed for this endpoint.", 405)


# Load artifacts at import time so Gunicorn workers are ready immediately.
load_artifacts()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
