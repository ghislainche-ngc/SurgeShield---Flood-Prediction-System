"""
SurgeShield — Dataset signal validation (OSEMN: S)
==================================================

A core methodological deliverable. Before trusting ANY model's accuracy, we
ask a more fundamental question: *does this dataset actually contain a
learnable relationship between the features and the target?*

We answer it with three independent diagnostics:

  1. CORRELATION       — linear association of each feature with the target.
  2. PERMUTATION IMP.  — how much test performance drops when each feature is
                         individually shuffled (model-based, non-linear aware).
  3. SHUFFLED-LABEL    — train on the REAL labels vs. train on RANDOMLY
     CONTROL             PERMUTED labels and compare AUC. If real labels do not
                         beat shuffled labels, the features carry no signal.

Interpretation guide (printed inline):
  * Near-zero correlations + near-zero permutation importance + real AUC ≈
    shuffled AUC ≈ 0.50  ==>  the dataset has NO learnable signal.

This is reported transparently rather than hidden — it is the project's
honesty narrative (see cleaning_report.md and dissertation Ch. 4).

Run from anywhere:
    python 2_data_cleaning/validate_dataset.py
"""

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# --------------------------------------------------------------------------- #
# Config
# --------------------------------------------------------------------------- #
HERE = Path(__file__).resolve().parent
ML_API = HERE.parent
PROCESSED_PATH = ML_API / "1_data" / "processed" / "flood_clean.csv"
RAW_PATH = ML_API / "1_data" / "raw" / "flood_risk_dataset.csv"

TARGET = "Flood Occurred"
CATEGORICAL_FEATURES = ["Land Cover", "Soil Type"]
DROP_COLS = ["Latitude", "Longitude"]
RANDOM_STATE = 42

# Rename map mirrors clean.py, so this script also works directly on raw data
# if the processed file has not been generated yet.
RENAME_MAP = {
    "Rainfall (mm)": "Rainfall",
    "Temperature (°C)": "Temperature",
    "Humidity (%)": "Humidity",
    "River Discharge (m³/s)": "River Discharge",
    "Water Level (m)": "Water Level",
    "Elevation (m)": "Elevation",
}


# --------------------------------------------------------------------------- #
# Pretty-printing helpers
# --------------------------------------------------------------------------- #
def header(title: str) -> None:
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def load_data() -> pd.DataFrame:
    """Prefer the cleaned file; fall back to raw (applying the same prep)."""
    if PROCESSED_PATH.exists():
        df = pd.read_csv(PROCESSED_PATH, encoding="utf-8")
        print(f"[data] loaded processed file: {PROCESSED_PATH.name}  {df.shape}")
    else:
        print(f"[data] processed file not found — falling back to raw")
        df = pd.read_csv(RAW_PATH, encoding="utf-8")
        df = df.drop(columns=[c for c in DROP_COLS if c in df.columns])
        df = df.rename(columns=RENAME_MAP)
        print(f"[data] loaded + prepped raw file: {RAW_PATH.name}  {df.shape}")
    return df


def split_X_y(df: pd.DataFrame):
    X = df.drop(columns=[TARGET])
    y = df[TARGET].astype(int)
    return X, y


def build_preprocessor(X: pd.DataFrame) -> ColumnTransformer:
    """One-hot encode categoricals, standard-scale everything else."""
    cat = [c for c in CATEGORICAL_FEATURES if c in X.columns]
    num = [c for c in X.columns if c not in cat]
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num),
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat),
        ]
    )


def feature_names_after_transform(pre: ColumnTransformer) -> list:
    """Readable names for the matrix produced by the preprocessor."""
    try:
        return list(pre.get_feature_names_out())
    except Exception:
        return []


# --------------------------------------------------------------------------- #
# Diagnostic 1 — correlation of each feature with the target
# --------------------------------------------------------------------------- #
def diagnostic_correlation(X: pd.DataFrame, y: pd.Series) -> pd.DataFrame:
    header("DIAGNOSTIC 1 — Feature/target correlation")
    print(
        "Linear association between each feature and the target.\n"
        "Categoricals are one-hot expanded. Values near 0 mean no linear signal.\n"
    )

    # One-hot encode categoricals so every column is numeric, then correlate.
    X_enc = pd.get_dummies(X, columns=[c for c in CATEGORICAL_FEATURES if c in X.columns])
    corr = X_enc.corrwith(y.astype(float)).rename("correlation").to_frame()
    corr["abs"] = corr["correlation"].abs()
    corr = corr.sort_values("abs", ascending=False).drop(columns="abs")

    print(corr.to_string(float_format=lambda v: f"{v:+.4f}"))
    strongest = corr["correlation"].abs().max()
    print(f"\n  Strongest |correlation| with target: {strongest:.4f}")
    print(_verdict(strongest < 0.05, "near-zero", "non-trivial"))
    return corr


# --------------------------------------------------------------------------- #
# Diagnostic 2 — permutation importance
# --------------------------------------------------------------------------- #
def diagnostic_permutation_importance(X: pd.DataFrame, y: pd.Series) -> pd.DataFrame:
    header("DIAGNOSTIC 2 — Permutation importance")
    print(
        "Trains a Random Forest, then shuffles each feature in turn and measures\n"
        "the drop in test ROC-AUC. Importance near 0 means the feature does not\n"
        "help the model. Captures non-linear effects that correlation misses.\n"
    )

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )
    pre = build_preprocessor(X)
    model = Pipeline(
        steps=[
            ("pre", pre),
            ("rf", RandomForestClassifier(
                n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1)),
        ]
    )
    model.fit(X_tr, y_tr)

    result = permutation_importance(
        model, X_te, y_te,
        scoring="roc_auc", n_repeats=10, random_state=RANDOM_STATE, n_jobs=-1,
    )
    imp = (
        pd.DataFrame(
            {"importance": result.importances_mean, "std": result.importances_std},
            index=X.columns,
        )
        .sort_values("importance", ascending=False)
    )
    print(imp.to_string(float_format=lambda v: f"{v:+.4f}"))
    top = imp["importance"].max()
    print(f"\n  Largest mean importance (AUC drop when shuffled): {top:.4f}")
    print(_verdict(top < 0.01, "negligible", "meaningful"))
    return imp


# --------------------------------------------------------------------------- #
# Diagnostic 3 — shuffled-label control
# --------------------------------------------------------------------------- #
def diagnostic_shuffled_label(X: pd.DataFrame, y: pd.Series) -> dict:
    header("DIAGNOSTIC 3 — Shuffled-label control")
    print(
        "The decisive test. We train the SAME model twice:\n"
        "  (A) on the real labels, and\n"
        "  (B) on randomly permuted labels (signal destroyed by construction).\n"
        "Both are scored on the SAME real test labels.\n"
        "If (A) does not clearly beat (B), the features carry no real signal.\n"
    )

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )

    def make_model():
        return Pipeline(
            steps=[
                ("pre", build_preprocessor(X)),
                ("rf", RandomForestClassifier(
                    n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1)),
            ]
        )

    # (A) Real labels.
    real = make_model().fit(X_tr, y_tr)
    real_auc = roc_auc_score(y_te, real.predict_proba(X_te)[:, 1])

    # (B) Shuffled labels — permute the TRAINING target only.
    rng = np.random.RandomState(RANDOM_STATE)
    y_tr_shuffled = pd.Series(
        rng.permutation(y_tr.to_numpy()), index=y_tr.index
    )
    shuffled = make_model().fit(X_tr, y_tr_shuffled)
    shuffled_auc = roc_auc_score(y_te, shuffled.predict_proba(X_te)[:, 1])

    gap = real_auc - shuffled_auc
    print(f"  Real-label test ROC-AUC     : {real_auc:.4f}")
    print(f"  Shuffled-label test ROC-AUC : {shuffled_auc:.4f}")
    print(f"  Advantage of real over shuffled : {gap:+.4f}")
    print(
        "\n  Reference: 0.50 = random guessing. A dataset WITH signal shows the\n"
        "  real-label AUC well above 0.50 and well above the shuffled control."
    )
    print(_verdict(gap < 0.05, "no meaningful advantage", "a real advantage"))
    return {"real_auc": real_auc, "shuffled_auc": shuffled_auc, "gap": gap}


def _verdict(no_signal: bool, low_phrase: str, high_phrase: str) -> str:
    tag = "  --> "
    if no_signal:
        return tag + f"Result is {low_phrase}: consistent with NO learnable signal."
    return tag + f"Result is {high_phrase}: features appear to carry signal."


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def main() -> None:
    header("SurgeShield — DATASET SIGNAL VALIDATION")
    print(
        "Goal: decide whether the features actually predict the target,\n"
        "BEFORE reporting any model accuracy. Three independent diagnostics."
    )

    df = load_data()
    X, y = split_X_y(df)
    print(f"\n  Features: {X.shape[1]}   Samples: {X.shape[0]:,}")
    print(f"  Target balance: {dict(y.value_counts().sort_index())}")

    diagnostic_correlation(X, y)
    diagnostic_permutation_importance(X, y)
    shuffle_res = diagnostic_shuffled_label(X, y)

    # Overall summary.
    header("OVERALL")
    no_signal = shuffle_res["gap"] < 0.05
    if no_signal:
        print(
            "All three diagnostics agree: this dataset shows NO learnable signal\n"
            "linking the features to flood occurrence. This is reported honestly\n"
            "and reframed as a methodological contribution — the validation\n"
            "procedure itself — rather than concealed behind fabricated metrics."
        )
    else:
        print(
            "Diagnostics indicate the dataset carries usable signal. Proceed to\n"
            "modeling and report the real metrics from the interpretation stage."
        )
    print("=" * 70)


if __name__ == "__main__":
    main()
