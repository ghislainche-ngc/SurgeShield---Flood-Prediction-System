# Data Cleaning & Signal-Validation Report

> **SurgeShield — OSEMN Scrub stage (S)**
> Feeds dissertation **Chapter 3 (Methodology)** and **Chapter 4 (Findings)**.
> Reproduce with: `python 2_data_cleaning/clean.py` then `python 2_data_cleaning/validate_dataset.py`.

---

## 1. Source data

| Property | Value |
|----------|-------|
| File | `1_data/raw/flood_risk_dataset.csv` (immutable) |
| Rows | 10,000 |
| Columns | 14 (`Latitude`, `Longitude`, 11 features, target `Flood Occurred`) |
| Missing values | 0 |
| Duplicate rows | 0 |
| Target balance | 5,057 flood (1) / 4,943 no-flood (0) ≈ **50.6% / 49.4%** |

The dataset arrived essentially pristine — no nulls, no duplicates. The cleaning
step is therefore light; the substantive work of this stage is the **signal
validation** in Section 3.

---

## 2. Cleaning steps (`clean.py`)

Cleaning reads from `1_data/raw/` and writes to `1_data/processed/flood_clean.csv`.
**The raw file is opened read-only and is never modified or overwritten.**

| # | Step | Detail | Effect |
|---|------|--------|--------|
| 1 | Drop coordinates | Remove `Latitude`, `Longitude` | Excluded from modeling; retained upstream only for map display |
| 2 | Tidy column names | Strip units: `Rainfall (mm)`→`Rainfall`, `Temperature (°C)`→`Temperature`, `River Discharge (m³/s)`→`River Discharge`, `Water Level (m)`→`Water Level`, `Elevation (m)`→`Elevation` | One shared vocabulary across pipeline, Flask API, and frontend |
| 3 | De-duplicate | Drop exact duplicate rows | 0 removed |
| 4 | Coerce types | Numeric → `float`; `Infrastructure`, `Historical Floods`, target → `int`; `Land Cover`, `Soil Type` → trimmed strings | Consistent, model-ready dtypes |
| 5 | Handle nulls | Drop any row left invalid after coercion | 0 removed |

**Output:** `1_data/processed/flood_clean.csv` — 10,000 rows × 12 columns
(11 features + target).

### Final feature schema

- **Numeric (7):** Rainfall, Temperature, Humidity, River Discharge, Water Level, Elevation, Population Density
- **Categorical (2):** Land Cover *(Agricultural, Desert, Forest, Urban, Water Body)*, Soil Type *(Clay, Loam, Peat, Sandy, Silt)*
- **Binary (2):** Infrastructure (0/1), Historical Floods (0/1)
- **Target:** Flood Occurred (0/1)

---

## 3. Signal validation (`validate_dataset.py`)

Before reporting any model accuracy, we test a more fundamental question: **do
the features actually contain information about the target?** A model will
always output *some* accuracy; that number is only meaningful if a learnable
relationship exists. Three independent diagnostics were run.

### Diagnostic 1 — Feature/target correlation

Linear association of each feature with the target (categoricals one-hot
expanded), sorted by magnitude. Every value clusters around zero.

| Feature | Correlation |
|---------|-------------|
| Humidity | +0.0278 |
| Land Cover = Water Body | −0.0261 |
| Temperature | −0.0158 |
| Soil Type = Loam | −0.0147 |
| Historical Floods | +0.0120 |
| … (all others) | within ±0.013 |
| Rainfall | −0.0022 |
| River Discharge | −0.0021 |

**Strongest \|correlation\|: 0.028** → near-zero. No linear signal.

### Diagnostic 2 — Permutation importance

Correlation only sees linear effects. We trained a Random Forest (200 trees,
stratified 80/20 split) and shuffled each feature in turn, measuring the drop in
test ROC-AUC. A feature that matters causes a large drop; importance near zero
means the model never relied on it.

| Feature | Mean importance (AUC drop) |
|---------|----------------------------|
| Rainfall | +0.0073 |
| River Discharge | +0.0043 |
| Temperature | +0.0030 |
| … | ~0 |
| Population Density | −0.0093 |

**Largest mean importance: 0.007** → negligible. Several features score
*negative* (shuffling them slightly *improves* AUC), the signature of noise.

### Diagnostic 3 — Shuffled-label control (decisive test)

The same model was trained twice — once on the real training labels, once on
**randomly permuted** training labels (signal destroyed by construction) — and
both were scored on the *same* real test labels. If a genuine relationship
exists, the real-label model must clearly beat the shuffled control.

| Model | Test ROC-AUC |
|-------|--------------|
| Real labels | **0.4943** |
| Shuffled labels | **0.4967** |
| Advantage of real over shuffled | **−0.0024** |

Reference: 0.50 = random guessing. The real-label model does **not** beat the
shuffled control — it is marginally *worse* and both sit at ~0.50.

---

## 4. Finding

**All three diagnostics agree: the dataset carries no learnable signal linking
the 11 features to flood occurrence.** Near-zero correlations, negligible
permutation importance, and a real-label model indistinguishable from a
shuffled-label control (both ≈ 0.50 ROC-AUC) form a consistent, mutually
corroborating picture. This is not a tuning problem or a model-choice problem —
the information simply is not present in the features.

This explains the ~50/50 target balance observed in Section 1: with no feature
separating the classes, the labels behave as if assigned at random.

---

## 5. Response & implications

Rather than fabricate or cherry-pick metrics, SurgeShield treats this as a
result to report honestly:

1. **Report real performance transparently.** The analytics UI renders every
   number at runtime from `5_interpretation/metrics.json` — no value is ever
   hard-coded. The ~0.50 scores are shown as they are.
2. **Elevate the validation procedure to a contribution.** This `validate_dataset.py`
   protocol — correlation + permutation importance + shuffled-label control —
   is itself a reusable methodological deliverable for screening any candidate
   dataset before modeling.
3. **Frame the deliverable as the system, not the score.** SurgeShield is a
   complete, production-deployed, full-stack ML prediction system ready to
   consume any properly-signalled dataset; swapping in such a dataset and
   retraining requires no architectural change.
4. **Document it.** This finding anchors dissertation **Chapter 4 (Findings)**
   and the recommendations in **Chapter 5** (e.g. sourcing data with real
   hydrological/terrain signal: DEMs, river-gauge time series).

This converts an apparent dataset weakness into demonstrated scientific
maturity: the project knew to ask whether the data was learnable at all, built
the tools to answer rigorously, and reported the answer truthfully.
