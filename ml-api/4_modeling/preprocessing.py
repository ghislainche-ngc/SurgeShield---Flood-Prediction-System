"""
SurgeShield — Shared preprocessing (OSEMN: M)
=============================================

One place that defines how raw feature rows become a model-ready matrix, so the
training pipeline and the Flask API can never disagree on the transform.

Transform:
  * 7 continuous numeric features  -> StandardScaler
  * 2 binary features (0/1)        -> passed through unchanged
  * 2 categorical features         -> OneHotEncoder (Land Cover, Soil Type)

Two entry points:
  * build_preprocessor()  -> an UNFITTED sklearn ColumnTransformer. Used inside
    cross-validation (refit per fold = no leakage) and for the final fit.
  * transform_features(X, scaler, encoder) -> applies the SAVED scaler/encoder
    artifacts to new rows. Used by the API at predict time.

Column order out of both paths is identical: numeric (scaled) + binary
(passthrough) + categorical (one-hot). train.py asserts the two paths match.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# --------------------------------------------------------------------------- #
# Feature schema (matches 1_data/processed/flood_clean.csv)
# --------------------------------------------------------------------------- #
NUMERIC_FEATURES = [
    "Rainfall", "Temperature", "Humidity", "River Discharge",
    "Water Level", "Elevation", "Population Density",
]
BINARY_FEATURES = ["Infrastructure", "Historical Floods"]
CATEGORICAL_FEATURES = ["Land Cover", "Soil Type"]
TARGET = "Flood Occurred"

# The full ordered feature list expected on input (11 features).
FEATURE_COLUMNS = NUMERIC_FEATURES + BINARY_FEATURES + CATEGORICAL_FEATURES


def split_xy(df: pd.DataFrame):
    """Split a cleaned frame into feature matrix X and target y."""
    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET].astype(int).copy()
    return X, y


def make_encoder() -> OneHotEncoder:
    """OneHotEncoder configured to tolerate unseen categories at predict time."""
    return OneHotEncoder(handle_unknown="ignore", sparse_output=False)


def build_preprocessor() -> ColumnTransformer:
    """Unfitted ColumnTransformer: scale numerics, passthrough binary, OHE cats.

    Transformer order fixes the output column order to:
        numeric (scaled) | binary (passthrough) | categorical (one-hot)
    """
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("bin", "passthrough", BINARY_FEATURES),
            ("cat", make_encoder(), CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )


def extract_scaler_encoder(fitted: ColumnTransformer):
    """Pull the fitted StandardScaler and OneHotEncoder out of a fitted CT.

    These two objects are what we persist as scaler.joblib / encoder.joblib.
    """
    scaler = fitted.named_transformers_["num"]
    encoder = fitted.named_transformers_["cat"]
    return scaler, encoder


def transform_features(X: pd.DataFrame, scaler: StandardScaler,
                       encoder: OneHotEncoder) -> np.ndarray:
    """Apply SAVED scaler + encoder to raw feature rows (inference path).

    Mirrors build_preprocessor()'s column order exactly:
        numeric (scaled) | binary (passthrough) | categorical (one-hot)
    """
    X = X[FEATURE_COLUMNS]  # enforce column presence + order
    # Pass DataFrames (with column names) so the scaler/encoder fitted inside
    # the ColumnTransformer see the names they expect — no sklearn warning.
    num = scaler.transform(X[NUMERIC_FEATURES])
    binary = X[BINARY_FEATURES].to_numpy(dtype=float)
    cat = encoder.transform(X[CATEGORICAL_FEATURES])
    return np.hstack([num, binary, cat])


def get_feature_names(encoder: OneHotEncoder) -> list[str]:
    """Readable names for the transformed matrix columns, in output order."""
    cat_names = list(encoder.get_feature_names_out(CATEGORICAL_FEATURES))
    return NUMERIC_FEATURES + BINARY_FEATURES + cat_names
