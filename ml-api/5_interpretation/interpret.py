"""
SurgeShield — Model interpretation (OSEMN: iNterpret)
=====================================================

Turns the trained artifacts into the real, reported outputs:

  metrics.json              SINGLE SOURCE OF TRUTH — best model + real metrics
  confusion_matrix.json     held-out test confusion matrix
  roc_data.json             ROC curve points + AUC for all three models
  feature_importances.json  per-feature importance for the best model

  figures/confusion_matrix.png
  figures/roc_curves.png
  figures/feature_importance.png
  figures/shap_summary.png   (best-effort; skipped if SHAP unavailable)

It loads the SAVED best model + scaler + encoder and reconstructs the SAME
stratified 80/20 split used in training (random_state=42), so every number here
corresponds to the genuine held-out test set. Nothing is hard-coded.

Runs headlessly. Run from anywhere:
    python 5_interpretation/interpret.py
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")  # headless — set before pyplot import

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.base import clone
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score,
                             roc_curve)
from sklearn.model_selection import train_test_split

# Shared preprocessing + the model definitions, both in 4_modeling.
HERE = Path(__file__).resolve().parent
ML_API = HERE.parent
MODELING_DIR = ML_API / "4_modeling"
MODELS_DIR = MODELING_DIR / "models"
DATA_PATH = ML_API / "1_data" / "processed" / "flood_clean.csv"
FIG_DIR = HERE / "figures"

if str(MODELING_DIR) not in sys.path:
    sys.path.insert(0, str(MODELING_DIR))
import preprocessing as pp  # noqa: E402
import train as trainmod  # noqa: E402  (reuse get_models + protocol constants)

CLASS_LABELS = ["No Flood", "Flood"]
sns.set_theme(style="whitegrid")


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _save(fig: plt.Figure, name: str) -> None:
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    path = FIG_DIR / name
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"[fig]  {path.relative_to(ML_API)}")


def _write_json(obj, path: Path) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)
    print(f"[json] {path.relative_to(ML_API)}")


def _encoded_to_original(encoder) -> list[str]:
    """Map each encoded column to its parent original feature name."""
    names = pp.get_feature_names(encoder)
    out = []
    for n in names:
        parent = next((c for c in pp.CATEGORICAL_FEATURES if n.startswith(c + "_")), n)
        out.append(parent)
    return out


# --------------------------------------------------------------------------- #
# Load artifacts + reconstruct the held-out test split
# --------------------------------------------------------------------------- #
def load_context():
    for p in ("best_model.joblib", "scaler.joblib", "encoder.joblib",
              "all_models_comparison.json"):
        if not (MODELS_DIR / p).exists():
            raise FileNotFoundError(
                f"{MODELS_DIR / p} missing. Run `python 4_modeling/train.py` first.")
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"{DATA_PATH} missing. Run clean.py first.")

    model = joblib.load(MODELS_DIR / "best_model.joblib")
    scaler = joblib.load(MODELS_DIR / "scaler.joblib")
    encoder = joblib.load(MODELS_DIR / "encoder.joblib")
    with open(MODELS_DIR / "all_models_comparison.json", encoding="utf-8") as f:
        comparison = json.load(f)

    df = pd.read_csv(DATA_PATH, encoding="utf-8")
    X, y = pp.split_xy(df)
    # SAME split as train.py — reproduces the exact held-out test set.
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=trainmod.TEST_SIZE, stratify=y,
        random_state=trainmod.RANDOM_STATE)

    X_tr_t = pp.transform_features(X_tr, scaler, encoder)
    X_te_t = pp.transform_features(X_te, scaler, encoder)
    return {
        "model": model, "scaler": scaler, "encoder": encoder,
        "comparison": comparison, "best_name": comparison["best_model"],
        "X_tr_t": X_tr_t, "X_te_t": X_te_t, "y_tr": y_tr, "y_te": y_te,
    }


# --------------------------------------------------------------------------- #
# 1. Metrics (single source of truth)
# --------------------------------------------------------------------------- #
def build_metrics(ctx) -> dict:
    model, X_te_t, y_te = ctx["model"], ctx["X_te_t"], ctx["y_te"]
    pred = model.predict(X_te_t)
    proba = model.predict_proba(X_te_t)[:, 1]
    metrics = {
        "accuracy": float(accuracy_score(y_te, pred)),
        "precision": float(precision_score(y_te, pred, zero_division=0)),
        "recall": float(recall_score(y_te, pred, zero_division=0)),
        "f1": float(f1_score(y_te, pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_te, proba)),
    }
    comp = ctx["comparison"]
    return {
        "best_model": ctx["best_name"],
        "metrics": metrics,
        "feature_count": comp.get("feature_count_raw"),
        "feature_count_encoded": comp.get("feature_count_encoded"),
        "n_test": int(len(y_te)),
        "dataset": DATA_PATH.name,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "interpretation": (
            "All models perform at chance level (ROC-AUC approximately 0.50). "
            "The dataset carries no learnable signal; metrics are reported "
            "honestly and are not hard-coded."
        ),
    }


# --------------------------------------------------------------------------- #
# 2. Confusion matrix
# --------------------------------------------------------------------------- #
def build_confusion(ctx) -> dict:
    model, X_te_t, y_te = ctx["model"], ctx["X_te_t"], ctx["y_te"]
    pred = model.predict(X_te_t)
    cm = confusion_matrix(y_te, pred, labels=[0, 1])
    tn, fp, fn, tp = (int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1]))

    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt=",d", cmap="Greens", cbar=False,
                xticklabels=CLASS_LABELS, yticklabels=CLASS_LABELS, ax=ax,
                annot_kws={"size": 14})
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title(f"Confusion Matrix — {ctx['best_name']} (test set)",
                 fontweight="bold")
    _save(fig, "confusion_matrix.png")

    return {
        "model": ctx["best_name"],
        "labels": CLASS_LABELS,
        "matrix": cm.tolist(),       # [[TN, FP], [FN, TP]]
        "tn": tn, "fp": fp, "fn": fn, "tp": tp,
    }


# --------------------------------------------------------------------------- #
# 3. ROC data — all three models on the same test set
# --------------------------------------------------------------------------- #
def build_roc(ctx) -> dict:
    X_tr_t, X_te_t = ctx["X_tr_t"], ctx["X_te_t"]
    y_tr, y_te = ctx["y_tr"], ctx["y_te"]
    grid = np.linspace(0, 1, 101)

    models = {}
    for name, spec in trainmod.get_models().items():
        # Reuse the saved best model; refit the others on the same train matrix.
        est = ctx["model"] if name == ctx["best_name"] else clone(spec).fit(X_tr_t, y_tr)
        proba = est.predict_proba(X_te_t)[:, 1]
        fpr, tpr, _ = roc_curve(y_te, proba)
        tpr_grid = np.interp(grid, fpr, tpr)
        tpr_grid[0] = 0.0
        models[name] = {
            "fpr": grid.tolist(),
            "tpr": [float(v) for v in tpr_grid],
            "auc": float(roc_auc_score(y_te, proba)),
        }

    # Figure.
    fig, ax = plt.subplots(figsize=(7, 6))
    for name, d in models.items():
        ax.plot(d["fpr"], d["tpr"], linewidth=2, label=f"{name} (AUC={d['auc']:.3f})")
    ax.plot([0, 1], [0, 1], "k--", linewidth=1, label="Chance (AUC=0.500)")
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("ROC Curves — all curves sit on the chance diagonal",
                 fontweight="bold")
    ax.legend(loc="lower right")
    _save(fig, "roc_curves.png")

    return {"models": models, "chance_auc": 0.5}


# --------------------------------------------------------------------------- #
# 4. Feature importances (best model)
# --------------------------------------------------------------------------- #
def build_feature_importances(ctx) -> dict:
    model, encoder = ctx["model"], ctx["encoder"]
    parents = _encoded_to_original(encoder)

    if hasattr(model, "coef_"):
        kind = "logistic_coefficient"
        signed_vec = model.coef_.ravel()
    elif hasattr(model, "feature_importances_"):
        kind = "gini_importance"
        signed_vec = np.asarray(model.feature_importances_, dtype=float)
    else:
        kind = "unavailable"
        signed_vec = np.zeros(len(parents))

    # Aggregate encoded contributions back to the 11 original features.
    signed: dict[str, float] = {}
    for parent, val in zip(parents, signed_vec):
        signed[parent] = signed.get(parent, 0.0) + float(val)

    items = []
    for feat in pp.FEATURE_COLUMNS:
        s = signed.get(feat, 0.0)
        items.append({
            "feature": feat,
            "importance": round(abs(s), 6),
            "signed": round(s, 6) if kind == "logistic_coefficient" else None,
        })
    items.sort(key=lambda d: d["importance"], reverse=True)

    # Figure.
    fig, ax = plt.subplots(figsize=(8, 6))
    feats = [d["feature"] for d in items][::-1]
    vals = [d["importance"] for d in items][::-1]
    ax.barh(feats, vals, color="#1a3a2a", edgecolor="white")
    ax.set_xlabel(f"Importance ({kind})")
    ax.set_title(f"Feature Importance — {ctx['best_name']}", fontweight="bold")
    _save(fig, "feature_importance.png")

    return {"model": ctx["best_name"], "type": kind, "importances": items}


# --------------------------------------------------------------------------- #
# 5. SHAP summary (best-effort; never fails the run)
# --------------------------------------------------------------------------- #
def build_shap(ctx) -> None:
    try:
        import shap
        feat_names = pp.get_feature_names(ctx["encoder"])
        # Sample for speed; explain the best model on the test matrix.
        X = ctx["X_te_t"]
        sample = X[:500] if X.shape[0] > 500 else X
        explainer = shap.Explainer(ctx["model"].predict_proba, sample,
                                   feature_names=feat_names)
        sv = explainer(sample[:200])
        # For binary classifiers Explainer may return a 3D object; take class 1.
        values = sv[..., 1] if len(sv.shape) == 3 else sv
        fig = plt.figure()
        shap.plots.beeswarm(values, show=False, max_display=12)
        _save(plt.gcf(), "shap_summary.png")
    except Exception as exc:  # noqa: BLE001 - optional enrichment only
        print(f"[shap] skipped ({type(exc).__name__}: {exc})")


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def main() -> None:
    print("=" * 72)
    print("SurgeShield — model interpretation (iNterpret)")
    print("=" * 72)
    ctx = load_context()
    print(f"[ctx]  best model = {ctx['best_name']}  test n = {len(ctx['y_te']):,}")

    metrics = build_metrics(ctx)
    confusion = build_confusion(ctx)
    roc = build_roc(ctx)
    importances = build_feature_importances(ctx)
    build_shap(ctx)

    _write_json(metrics, HERE / "metrics.json")
    _write_json(confusion, HERE / "confusion_matrix.json")
    _write_json(roc, HERE / "roc_data.json")
    _write_json(importances, HERE / "feature_importances.json")

    m = metrics["metrics"]
    print("\nHeadline (held-out test):")
    print(f"  model={metrics['best_model']}  acc={m['accuracy']:.4f}  "
          f"f1={m['f1']:.4f}  roc_auc={m['roc_auc']:.4f}")
    print("=" * 72)
    print("Done. metrics.json is the single source of truth for the API + UI.")
    print("=" * 72)


if __name__ == "__main__":
    main()
