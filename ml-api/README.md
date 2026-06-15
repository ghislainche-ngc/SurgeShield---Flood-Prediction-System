# SurgeShield — ML Microservice (`ml-api/`)

Python ML microservice for **SurgeShield**, an AI-powered flood-prediction system.
The pipeline is organized by the **OSEMN** framework (Obtain → Scrub → Explore → Model → iNterpret), and a Flask API serves the trained model to the rest of the stack (Convex backend → Next.js frontend).

> **Honesty note (project framing):** All reported metrics are read at runtime from the JSON artifacts produced by the pipeline (`5_interpretation/metrics.json`, etc.). No accuracy/F1/ROC-AUC value is ever hard-coded. The dataset-validation finding (whether the target carries a learnable signal) is documented transparently in `2_data_cleaning/cleaning_report.md`.

---

## Dataset

- **File:** `1_data/raw/flood_risk_dataset.csv` (immutable — never modified)
- **Rows:** 10,000
- **Columns (14):** `Latitude`, `Longitude`, 11 input features, and the binary target `Flood Occurred`.

### Model features (11)

`Rainfall (mm)`, `Temperature (°C)`, `Humidity (%)`, `River Discharge (m³/s)`, `Water Level (m)`, `Elevation (m)`, `Land Cover`, `Soil Type`, `Population Density`, `Infrastructure`, `Historical Floods`

- **Target:** `Flood Occurred` (0 / 1)
- **Dropped from model features:** `Latitude`, `Longitude` — retained only for map visualization in the frontend, **not** used for training or prediction.
- **Note:** raw column names carry units and spaces exactly as shown above; stage code must reference these exact strings.

---

## Models (3)

The pipeline trains exactly **three** classifiers, one per major family:

| Model | Family | Role |
|-------|--------|------|
| Logistic Regression | Linear | Interpretable baseline |
| Random Forest | Bagging (ensemble) | Non-linear, robust to feature scale |
| XGBoost | Boosting (ensemble) | Gradient-boosted trees |

Training uses a stratified 80/20 split with 5-fold cross-validation; the best model is selected by F1. Artifacts and the model comparison are written to `4_modeling/models/`.

---

## OSEMN stage → folder map

| Stage | Folder | Purpose | Key files |
|-------|--------|---------|-----------|
| **O — Obtain** | `1_data/` | Load raw data, inspect shape/types, document provenance. Holds immutable `raw/` and pipeline output `processed/`. | `01_data_acquisition.ipynb`, `raw/flood_risk_dataset.csv`, `processed/flood_clean.csv`, `README.md` |
| **S — Scrub** | `2_data_cleaning/` | Clean (nulls, dupes, types), encode/scale, and validate that the dataset carries learnable signal. Reads `raw/`, writes `processed/`. | `02_data_cleaning.ipynb`, `clean.py`, `validate_dataset.py`, `cleaning_report.md` |
| **E — Explore** | `3_eda/` | Exploratory analysis; regenerate all dissertation figures headlessly. | `03_exploratory_data_analysis.ipynb`, `eda.py`, `figures/` |
| **M — Model** | `4_modeling/` | Train the 3 models, cross-validate, select best by F1, persist artifacts. | `04_model_training.ipynb`, `train.py`, `preprocessing.py`, `models/` |
| **N — iNterpret** | `5_interpretation/` | Confusion matrix, ROC, feature importance, SHAP. Emits the single source of truth for all reported metrics. | `05_model_interpretation.ipynb`, `interpret.py`, `metrics.json`, `confusion_matrix.json`, `roc_data.json`, `feature_importances.json`, `figures/` |

`metrics.json` (in `5_interpretation/`) is the **single source of truth** — the Flask API and the frontend UI read real numbers from it.

---

## Flask API (`app.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | POST | 11 environmental params → `{flood, probability, risk_level, top_factors}` |
| `/model-info` | GET | Best model name, real accuracy/F1/ROC-AUC, training date, feature count (from `metrics.json`) |
| `/analytics` | GET | 3-model comparison, confusion matrix, ROC data, feature importances (real JSON) |
| `/weather` | GET | Proxy to Open-Meteo: `?lat=&lon=` → live rainfall, temperature, humidity |
| `/health` | GET | `{status: "ok", model_loaded: true}` |

---

## Setup

```bash
cd ml-api
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run the pipeline (in OSEMN order)

```bash
python 2_data_cleaning/clean.py        # raw → processed/flood_clean.csv
python 4_modeling/train.py             # train 3 models, save best + scaler + encoder
python 5_interpretation/interpret.py   # produce metrics.json + figures
```

## Serve the API

```bash
gunicorn app:app -b 0.0.0.0:5000       # production
# or, for local dev:
python app.py
```

---

## Notes & caveats

- **`1_data/raw/` is immutable.** Cleaning reads from `raw/` and writes to `processed/`. Never overwrite raw data.
- **Digit-prefixed folders are not importable packages.** Run stage scripts directly (`python 4_modeling/train.py`); do not `import 4_modeling.train`. Shared logic (`preprocessing.py`) is imported via an explicit `sys.path` insert or kept as a local copy.
- **Notebook working directory is its own stage folder.** Use relative paths like `../1_data/raw/flood_risk_dataset.csv` from inside a stage notebook.
- **No hard-coded metrics anywhere** — every reported number flows from the pipeline JSON.
- `venv/` is gitignored.
