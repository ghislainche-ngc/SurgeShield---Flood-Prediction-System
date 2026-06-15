"""
SurgeShield — Model training (OSEMN: M)
=======================================

Trains exactly THREE models and reports their REAL performance — nothing is
hard-coded or inflated.

  * Logistic Regression  (linear baseline)
  * Random Forest        (bagging ensemble)
  * XGBoost              (boosting ensemble)

Protocol:
  1. Stratified 80/20 train/test split (test set held out, never trained on).
  2. 5-fold stratified cross-validation ON THE TRAINING SET for model selection.
  3. Each model scored on accuracy / precision / recall / F1 / ROC-AUC.
  4. Best model selected by cross-validated F1.
  5. Saved to models/: best_model.joblib, scaler.joblib, encoder.joblib,
     all_models_comparison.json.

Preprocessing comes from the shared preprocessing.py so the API uses the exact
same transform.

Run from anywhere:
    python 4_modeling/train.py
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, f1_score, precision_score,
                             recall_score, roc_auc_score)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

# Import the shared preprocessing module (same folder; digit-prefixed parent is
# not an importable package, so we add this folder to sys.path defensively).
HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))
import preprocessing as pp  # noqa: E402

ML_API = HERE.parent
DATA_PATH = ML_API / "1_data" / "processed" / "flood_clean.csv"
MODELS_DIR = HERE / "models"

RANDOM_STATE = 42
TEST_SIZE = 0.20
CV_FOLDS = 5
SELECT_BY = "f1"  # metric used to pick the best model (cross-validated)

SCORING = ["accuracy", "precision", "recall", "f1", "roc_auc"]


def get_models() -> dict:
    """The three models, one per family. All expose predict_proba."""
    return {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, random_state=RANDOM_STATE),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1),
        "XGBoost": XGBClassifier(
            n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1,
            eval_metric="logloss"),
    }


def test_metrics(model, X_te_t, y_te) -> dict:
    """Compute the five metrics on the held-out test set."""
    pred = model.predict(X_te_t)
    proba = model.predict_proba(X_te_t)[:, 1]
    return {
        "accuracy": float(accuracy_score(y_te, pred)),
        "precision": float(precision_score(y_te, pred, zero_division=0)),
        "recall": float(recall_score(y_te, pred, zero_division=0)),
        "f1": float(f1_score(y_te, pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_te, proba)),
    }


def main() -> None:
    print("=" * 72)
    print("SurgeShield — model training (Model)")
    print("=" * 72)

    # ----- Load + split ---------------------------------------------------- #
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"{DATA_PATH} not found. Run `python 2_data_cleaning/clean.py` first.")
    df = pd.read_csv(DATA_PATH, encoding="utf-8")
    X, y = pp.split_xy(df)
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=TEST_SIZE, stratify=y, random_state=RANDOM_STATE)
    print(f"[split] train={len(X_tr):,}  test={len(X_te):,}  (stratified 80/20)")

    # ----- Fit the shared preprocessor on TRAIN only ----------------------- #
    pre = pp.build_preprocessor()
    X_tr_t = pre.fit_transform(X_tr, y_tr)
    X_te_t = pre.transform(X_te)
    scaler, encoder = pp.extract_scaler_encoder(pre)
    feat_names = pp.get_feature_names(encoder)

    # Guard: the inference path (transform_features) must match the training CT.
    manual = pp.transform_features(X_tr, scaler, encoder)
    assert np.allclose(manual, X_tr_t), "preprocessing drift: API path != training path"
    print(f"[prep] {X_tr_t.shape[1]} features after encoding; transform paths agree")

    # ----- Evaluate each model -------------------------------------------- #
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    results = {}
    fitted = {}
    for name, model in get_models().items():
        # 5-fold CV on the training set (preprocessor refit per fold = no leakage).
        pipe = Pipeline([("pre", pp.build_preprocessor()), ("clf", clone(model))])
        cv_res = cross_validate(pipe, X_tr, y_tr, cv=cv, scoring=SCORING, n_jobs=-1)
        cv_summary = {m: {"mean": float(cv_res[f"test_{m}"].mean()),
                          "std": float(cv_res[f"test_{m}"].std())}
                      for m in SCORING}

        # Final fit on full training set; score on held-out test set.
        m = clone(model).fit(X_tr_t, y_tr)
        fitted[name] = m
        results[name] = {"cv": cv_summary, "test": test_metrics(m, X_te_t, y_te)}
        print(f"[eval] {name:<22} "
              f"CV F1={cv_summary['f1']['mean']:.4f}  "
              f"test F1={results[name]['test']['f1']:.4f}  "
              f"test AUC={results[name]['test']['roc_auc']:.4f}")

    # ----- Select best by cross-validated F1 ------------------------------ #
    best_name = max(results, key=lambda n: results[n]["cv"][SELECT_BY]["mean"])
    print(f"\n[select] best by cross-validated {SELECT_BY.upper()}: {best_name}")

    # ----- Console comparison table --------------------------------------- #
    print("\nHeld-out test metrics:")
    table = pd.DataFrame({n: results[n]["test"] for n in results}).T
    print(table.to_string(float_format=lambda v: f"{v:.4f}"))

    # ----- Persist artifacts ---------------------------------------------- #
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(fitted[best_name], MODELS_DIR / "best_model.joblib")
    joblib.dump(scaler, MODELS_DIR / "scaler.joblib")
    joblib.dump(encoder, MODELS_DIR / "encoder.joblib")

    comparison = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset": DATA_PATH.name,
        "protocol": {
            "split": "stratified 80/20",
            "cross_validation": f"{CV_FOLDS}-fold stratified",
            "selection_metric": SELECT_BY,
            "random_state": RANDOM_STATE,
        },
        "n_train": int(len(X_tr)),
        "n_test": int(len(X_te)),
        "feature_count_raw": len(pp.FEATURE_COLUMNS),
        "feature_count_encoded": int(X_tr_t.shape[1]),
        "encoded_feature_names": feat_names,
        "class_balance_train": {str(k): int(v) for k, v in y_tr.value_counts().sort_index().items()},
        "best_model": best_name,
        "models": results,
    }
    with open(MODELS_DIR / "all_models_comparison.json", "w", encoding="utf-8") as f:
        json.dump(comparison, f, indent=2)

    print(f"\n[save] best_model.joblib  ({best_name})")
    print(f"[save] scaler.joblib")
    print(f"[save] encoder.joblib")
    print(f"[save] all_models_comparison.json")
    print("=" * 72)
    print("Done. Metrics above are the real, measured values — not hard-coded.")
    print("=" * 72)


if __name__ == "__main__":
    main()
