"""
SurgeShield — Scrub stage (OSEMN: S)
====================================

Productionized data cleaning for the flood-risk dataset.

What this script does:
  1. Reads the IMMUTABLE raw dataset (../1_data/raw/flood_risk_dataset.csv).
  2. Drops Latitude / Longitude (kept only for map display, never for modeling).
  3. Renames columns to tidy keys (strips units) so the rest of the pipeline,
     the Flask API, and the frontend share one consistent vocabulary.
  4. Handles types, duplicates, and nulls.
  5. Writes the result to ../1_data/processed/flood_clean.csv.

The raw file is opened read-only and is NEVER modified or overwritten.

Run from anywhere:
    python 2_data_cleaning/clean.py
"""

from pathlib import Path

import pandas as pd

# --------------------------------------------------------------------------- #
# Paths — resolved relative to THIS file so the script works from any CWD.
# --------------------------------------------------------------------------- #
HERE = Path(__file__).resolve().parent          # .../ml-api/2_data_cleaning
ML_API = HERE.parent                             # .../ml-api
RAW_PATH = ML_API / "1_data" / "raw" / "flood_risk_dataset.csv"
PROCESSED_PATH = ML_API / "1_data" / "processed" / "flood_clean.csv"

# Columns excluded from the model (retained upstream only for map visuals).
DROP_COLS = ["Latitude", "Longitude"]

# Raw column name  ->  tidy key used everywhere downstream.
# We strip units/symbols but keep human-readable names.
RENAME_MAP = {
    "Rainfall (mm)": "Rainfall",
    "Temperature (°C)": "Temperature",      # °C
    "Humidity (%)": "Humidity",
    "River Discharge (m³/s)": "River Discharge",  # m³/s
    "Water Level (m)": "Water Level",
    "Elevation (m)": "Elevation",
    # Land Cover, Soil Type, Population Density, Infrastructure,
    # Historical Floods, Flood Occurred are already tidy.
}

TARGET = "Flood Occurred"

# Expected schema after cleaning (11 features + target).
NUMERIC_FEATURES = [
    "Rainfall", "Temperature", "Humidity", "River Discharge",
    "Water Level", "Elevation", "Population Density",
]
CATEGORICAL_FEATURES = ["Land Cover", "Soil Type"]
BINARY_FEATURES = ["Infrastructure", "Historical Floods"]


def load_raw() -> pd.DataFrame:
    """Read the raw CSV read-only. Fails loudly if it is missing."""
    if not RAW_PATH.exists():
        raise FileNotFoundError(f"Raw dataset not found at: {RAW_PATH}")
    df = pd.read_csv(RAW_PATH, encoding="utf-8")
    print(f"[load] raw shape: {df.shape[0]:,} rows x {df.shape[1]} cols")
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    """Apply the full cleaning sequence and return the tidy frame."""

    # 1) Drop geographic coordinates — not model features.
    present = [c for c in DROP_COLS if c in df.columns]
    df = df.drop(columns=present)
    print(f"[drop] removed coordinate columns: {present}")

    # 2) Rename to tidy keys.
    df = df.rename(columns=RENAME_MAP)
    print(f"[rename] tidied column names -> {list(df.columns)}")

    # 3) Drop exact duplicate rows.
    before = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    print(f"[dedupe] removed {before - len(df)} duplicate row(s)")

    # 4) Coerce types.
    #    Numeric/binary -> numeric; categoricals -> trimmed strings.
    for col in NUMERIC_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    for col in BINARY_FEATURES + [TARGET]:
        df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
    for col in CATEGORICAL_FEATURES:
        df[col] = df[col].astype("string").str.strip()
    print("[types] coerced numeric, binary, and categorical columns")

    # 5) Handle nulls. Any coercion failure above shows up here as NaN.
    null_total = int(df.isna().sum().sum())
    if null_total:
        before = len(df)
        df = df.dropna().reset_index(drop=True)
        print(f"[nulls] found {null_total} null cell(s); dropped {before - len(df)} row(s)")
    else:
        print("[nulls] none found")

    # Binary/target back to plain int now that nulls are gone.
    for col in BINARY_FEATURES + [TARGET]:
        df[col] = df[col].astype(int)

    return df


def save(df: pd.DataFrame) -> None:
    """Write the cleaned frame to processed/, creating the folder if needed."""
    PROCESSED_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(PROCESSED_PATH, index=False, encoding="utf-8")
    print(f"[save] wrote cleaned data: {PROCESSED_PATH}")
    print(f"[save] final shape: {df.shape[0]:,} rows x {df.shape[1]} cols")


def main() -> None:
    print("=" * 70)
    print("SurgeShield — data cleaning (Scrub)")
    print("=" * 70)
    df = load_raw()
    df = clean(df)
    save(df)
    print("=" * 70)
    print("Done. Raw data left untouched.")
    print("=" * 70)


if __name__ == "__main__":
    main()
