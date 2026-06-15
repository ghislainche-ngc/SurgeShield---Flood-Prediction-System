# SurgeShield — Final Project Structure

> **Project:** SurgeShield — AI-Powered Flood Prediction & Analytics System
> **Stack:** Next.js 14 (frontend) · Clerk (auth) · Convex (backend) · Python + Flask (ML microservice)
> **Deployment:** Single VPS (Ubuntu 22.04) behind Nginx with SSL
> **Project framing (Path A):** The contribution is the *engineered, production-deployed full-stack ML system*. Model performance is reported **honestly** from real metrics — never hard-coded. The dataset-validation finding (target carries no learnable signal) is documented transparently as a methodological strength, not hidden.

---

## Agent Instructions (read first)

This document is the source of truth for the folder/file layout. When building:

1. **Create files exactly at the paths shown below.** Folder names, prefixes, and casing matter.
2. **Never hard-code model metrics in the UI.** All accuracy / F1 / ROC-AUC / confusion-matrix / feature-importance values must be read at runtime from the JSON files produced by the ML pipeline (`5_interpretation/metrics.json`, etc.). If a design shows "93.2%", replace it with a value rendered from the real JSON.
3. **There are 11 input features, not 12.** (Rainfall, Temperature, Humidity, River Discharge, Water Level, Elevation, Land Cover, Soil Type, Population Density, Infrastructure, Historical Floods.) Latitude/Longitude are excluded from the model and retained only for map visualization. Fix every "12" reference to "11".
4. **`1_data/raw/` is immutable.** Cleaning reads from `raw/` and writes to `processed/`. Never overwrite raw data.
5. **ML pipeline is organized by OSEMN** (Obtain → Scrub → Explore → Model → iNterpret). Each numbered stage folder contains a notebook (the reasoning), a production script (the reproducible version), and where relevant a report (`.md`).
6. **Notebook working directory is its own folder.** Use relative paths like `../1_data/raw/flood_risk_dataset.csv` from inside a stage notebook.
7. **Python import caveat:** folder names starting with digits are not importable packages. Run stage scripts directly (e.g. `python 4_modeling/train.py`); do not attempt `import 4_modeling.train`. Shared logic (`preprocessing.py`) is imported via an explicit `sys.path` insert or kept as a local copy.
8. **Build order (4-day timeline):** scaffold frontend + Clerk + Convex (day 1) → ML pipeline + real metrics (day 2) → wire predict/map/analytics/admin (day 3) → deploy + polish (day 4). Dissertation drafted in parallel each evening.

---

## Top-Level Layout

```
surgeshield/
├── ml-api/          # Python ML microservice (OSEMN pipeline + Flask API)
├── convex/          # Convex backend (schema, queries, mutations, actions)
├── frontend/        # Next.js 14 App Router application
├── deployment/      # Nginx, PM2, deploy docs
├── docs/            # Defense Q&A, dissertation chapters
├── .gitignore
└── README.md
```

---

## `ml-api/` — Python ML Microservice (OSEMN)

```
ml-api/
│
├── 1_data/                              # OBTAIN
│   ├── raw/
│   │   └── flood_risk_dataset.csv       # original dataset — NEVER modified
│   ├── processed/
│   │   └── flood_clean.csv              # output of scrubbing
│   ├── 01_data_acquisition.ipynb        # load raw, inspect shape/types, document provenance
│   └── README.md                        # source, license, why this dataset, known limitations
│
├── 2_data_cleaning/                     # SCRUB
│   ├── 02_data_cleaning.ipynb           # cleaning steps + signal-validation analysis (narrative)
│   ├── clean.py                         # productionized: raw → handle nulls/dupes/types → processed
│   ├── validate_dataset.py              # signal tests: correlation, permutation importance, shuffled-label control
│   └── cleaning_report.md               # what was done + the no-signal finding (feeds dissertation Ch.3/4)
│
├── 3_eda/                               # EXPLORE
│   ├── 03_exploratory_data_analysis.ipynb
│   ├── eda.py                           # regenerates all figures headlessly
│   └── figures/                         # saved PNGs for dissertation Chapter 4 (6 charts)
│       ├── target_balance.png
│       ├── correlation_heatmap.png      # visual proof of near-zero feature/target correlation
│       ├── flood_rate_by_category.png   # the "~50% flood rate across every category" chart
│       ├── feature_distributions.png
│       ├── feature_boxplots_by_class.png  # medians/quartiles overlap across classes
│       └── categorical_composition.png    # record counts per Land Cover / Soil Type
│
├── 4_modeling/                          # MODEL
│   ├── 04_model_training.ipynb
│   ├── train.py                         # 3 models, stratified 80/20 split, 5-fold CV, select best by F1
│   ├── preprocessing.py                 # shared encoder (One-Hot) + scaler (StandardScaler) pipeline
│   ├── models/
│   │   ├── best_model.joblib
│   │   ├── scaler.joblib
│   │   ├── encoder.joblib
│   │   └── all_models_comparison.json
│   └── modeling_report.md               # models chosen, hyperparameters, why F1 as selector
│
├── 5_interpretation/                    # iNTERPRET
│   ├── 05_model_interpretation.ipynb
│   ├── interpret.py                     # confusion matrix, ROC, feature importance, SHAP
│   ├── metrics.json                     # SINGLE SOURCE OF TRUTH — API + UI read REAL numbers here
│   ├── confusion_matrix.json
│   ├── roc_data.json
│   ├── feature_importances.json
│   └── figures/
│       ├── confusion_matrix.png
│       ├── roc_curves.png
│       └── feature_importance.png
│
├── app.py                               # Flask API (served by Gunicorn)
├── requirements.txt
├── README.md                            # maps each folder to its OSEMN stage
└── venv/                                # (gitignored)
```

### Models trained (`train.py`)
Exactly **three** models, one per major family:
- **Logistic Regression** — linear baseline
- **Random Forest** — bagging ensemble
- **XGBoost** — boosting ensemble

All three expose `predict_proba`, so the risk gauge always has a probability to display.

### Flask API endpoints (`app.py`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | POST | 11 environmental params → `{flood: bool, probability: float, risk_level: str, top_factors: [...]}` |
| `/model-info` | GET | Best model name, real accuracy/F1/ROC-AUC, training date, feature count (from `metrics.json`) |
| `/analytics` | GET | All 3-model comparison, confusion matrix, ROC data, feature importances (real JSON) |
| `/weather` | GET | Proxy to Open-Meteo: `?lat=&lon=` → live rainfall, temperature, humidity |
| `/health` | GET | `{status: "ok", model_loaded: true}` |

### `requirements.txt`
```
flask
flask-cors
gunicorn
pandas
numpy
scikit-learn
xgboost
shap
joblib
matplotlib
seaborn
jupyter
requests
```

---

## `convex/` — Backend

```
convex/
├── schema.ts            # tables: predictions, savedLocations, systemStats
├── predictions.ts       # savePrediction, getUserPredictions, getRecentPredictions,
│                        #   getAllPredictions (admin), getPredictionStats
├── locations.ts         # saveLocation, getUserLocations, deleteLocation, getAllLocations (admin)
├── admin.ts             # getSystemOverview, getUserList, getActivityFeed
├── http.ts              # (optional) inbound HTTP endpoints
└── actions/
    ├── predict.ts       # action: receive params → call Flask /predict → store → return
    └── weather.ts       # action: call Flask /weather (or Open-Meteo directly) → return live weather
```

### `schema.ts` tables
```
predictions:
  userId (string, indexed)
  inputs (object: all 11 environmental params)
  result (boolean)
  probability (float 0–1)
  riskLevel (string: "Low" | "Moderate" | "High" | "Critical")
  topFactors (array of {feature, contribution})
  latitude (optional float)
  longitude (optional float)
  locationName (optional string)
  weatherSource (string: "live" | "manual")     # provenance for defense
  weatherFetchedAt (optional number)
  createdAt (number, indexed)

savedLocations:
  userId (string, indexed)
  name (string)
  latitude (float)
  longitude (float)
  lastRiskLevel (string)
  lastChecked (number)

systemStats:
  totalPredictions (number)
  totalUsers (number)
  floodDetectedCount (number)
  lastUpdated (number)
```

> **Convex note:** calling the external Flask API requires a regular Convex **action** (actions can use `fetch`), not an `httpAction` (those receive inbound requests).

---

## `frontend/` — Next.js 14 (App Router)

```
frontend/
├── public/
│   └── images/                      # Fable hero photos, icons, logo
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Clerk + Convex providers; fonts (Playfair Display + Inter)
│   │   ├── globals.css              # design tokens (forest green / teal / cream)
│   │   ├── page.tsx                 # Landing (public)            — Fable PROMPT 1
│   │   ├── about/page.tsx           # About / How it works (public) — PROMPT 10
│   │   ├── sign-in/[[...sign-in]]/page.tsx   # PROMPT 2
│   │   ├── sign-up/[[...sign-up]]/page.tsx   # PROMPT 2
│   │   ├── dashboard/page.tsx       # User dashboard (protected)  — PROMPT 3
│   │   ├── predict/page.tsx         # Prediction engine + result (protected) — PROMPT 4 + 5
│   │   ├── map/page.tsx             # Interactive map (protected) — PROMPT 6
│   │   ├── analytics/page.tsx       # Model analytics (protected) — PROMPT 7
│   │   ├── history/page.tsx         # Prediction history (protected) — PROMPT 8
│   │   └── admin/page.tsx           # Admin panel (admin role only) — PROMPT 9
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # dark sidebar, active nav pill
│   │   │   ├── Navbar.tsx           # public top nav
│   │   │   └── TopBar.tsx           # greeting + notification bell
│   │   ├── landing/
│   │   │   ├── Hero.tsx
│   │   │   ├── StatsSection.tsx     # global flood stats (cited) + REAL model accuracy
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── FeaturesGrid.tsx
│   │   │   └── CTASection.tsx
│   │   ├── predict/
│   │   │   ├── PredictionForm.tsx   # 11 inputs: sliders / dropdowns / toggles + tooltips
│   │   │   ├── WeatherFetch.tsx     # "Use my location" → Open-Meteo autofill (with fallback)
│   │   │   ├── ResultDisplay.tsx    # animated result reveal
│   │   │   ├── RiskGauge.tsx        # circular probability gauge
│   │   │   └── ContributingFactors.tsx
│   │   ├── analytics/
│   │   │   ├── ModelComparison.tsx  # reads all_models_comparison.json (REAL)
│   │   │   ├── ConfusionMatrix.tsx  # reads confusion_matrix.json (REAL)
│   │   │   ├── ROCCurve.tsx         # reads roc_data.json (REAL)
│   │   │   ├── FeatureChart.tsx     # reads feature_importances.json (REAL)
│   │   │   └── DatasetOverview.tsx
│   │   ├── map/
│   │   │   └── FloodMap.tsx         # react-leaflet, dark tiles
│   │   ├── history/
│   │   │   └── PredictionTable.tsx  # sortable/filterable, expandable rows, CSV export
│   │   ├── admin/
│   │   │   └── AdminDashboard.tsx
│   │   └── ui/
│   │       ├── StatsCard.tsx
│   │       ├── RiskBadge.tsx
│   │       ├── Tooltip.tsx
│   │       └── Button.tsx
│   │
│   ├── lib/
│   │   ├── constants.ts             # 11 feature names, ranges, defaults, tooltip copy
│   │   ├── convex.ts                # Convex client setup
│   │   └── utils.ts                 # riskLevel(prob), formatters
│   │
│   └── middleware.ts                # Clerk route protection + admin-only /admin gate
│
├── .env.local                       # (gitignored)
├── next.config.js
├── tailwind.config.ts               # forest-green / teal / cream design tokens
├── tsconfig.json
└── package.json
```

### Design tokens (from Fable designs)
- **Palette:** deep forest green `#1a3a2a`, teal `#0d9488`, warm cream `#faf7f2`, dark charcoal `#1c1c1c`, white. Risk colors: green `#22c55e` (Low), amber `#f59e0b` (Moderate), red `#ef4444` (High), dark red (Critical).
- **Type:** Playfair Display (serif) for headings, Inter (sans) for body.
- **Style:** sidebar app shell, white cards on cream, rounded corners, soft shadows, generous whitespace. Nature/environmental feel — not generic tech blue.

### Live weather flow (Open-Meteo — no API key required)
1. User picks a location (search or map click) → lat/lon.
2. Convex `weather` action (or `/weather` Flask proxy) calls Open-Meteo → returns live Rainfall, Temperature, Humidity.
3. Those three fields auto-fill in `PredictionForm` and show a "Live data" badge.
4. Remaining 8 fields (hydrology, terrain, demographics) are user-supplied.
5. On submit, `weatherSource` is recorded as `"live"` or `"manual"`.
> Be honest in defense: live weather supplies 3 of 11 inputs; terrain/hydrology are user-entered (future work: DEM + river-gauge APIs). Cache weather ~10 min per location; fall back to manual entry on network error.

---

## `deployment/`

```
deployment/
├── nginx.conf            # reverse proxy: / → Next.js :3000, /ml-api/ → Flask :5000
├── ecosystem.config.js   # PM2 process config
└── DEPLOY.md             # step-by-step VPS setup, SSL via Certbot
```

### `nginx.conf` (reference)
```nginx
server {
    listen 80;
    server_name surgeshield.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name surgeshield.com;
    # SSL certs managed by Certbot

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ml-api/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Environment variables
```
# frontend/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud

# convex (set via npx convex env set)
ML_API_URL=http://localhost:5000
```

### Server setup (Ubuntu 22.04)
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx python3 python3-pip python3-venv nodejs npm -y
npm install -g pm2

git clone <repo-url> /var/www/surgeshield
cd /var/www/surgeshield

# ML API
cd ml-api
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python 2_data_cleaning/clean.py        # raw → processed
python 4_modeling/train.py             # train + save artifacts
python 5_interpretation/interpret.py   # produce metrics.json + figures
gunicorn app:app -b 0.0.0.0:5000 --daemon

# Frontend
cd ../frontend
npm install && npm run build
pm2 start npm --name "surgeshield" -- start

# Convex
npx convex deploy

# SSL
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d surgeshield.com
```

---

## `docs/`

```
docs/
├── DEFENSE_QA.md                 # 30+ likely questions with answers, incl. the dataset-honesty narrative
└── dissertation/                 # ICTU FYP chapters (Times New Roman 12pt, 1.5 spacing, justified, APA)
    ├── 00_preliminary_pages.docx
    ├── chapter_1_introduction.docx
    ├── chapter_2_literature_review.docx
    ├── chapter_3_methodology.docx
    ├── chapter_4_analysis_design_implementation_findings.docx
    ├── chapter_5_summary_conclusions_recommendations.docx
    └── references.docx
```

---

## Defense narrative — dataset honesty (keep this consistent everywhere)

During evaluation, the chosen public flood dataset was found to carry **no learnable signal**: feature/target correlations were near zero, permutation importance was negligible, and a **shuffled-label control** scored the same as the real labels (≈0.50 ROC-AUC across all three models, including XGBoost with cross-validation). Rather than fabricate metrics, the project:

1. Reports the **real** model performance transparently in the analytics UI (rendered from `metrics.json`).
2. Presents the **data-validation procedure** (`validate_dataset.py`) as a methodological contribution.
3. Frames the deliverable as a **complete, deployable prediction system** ready to consume any properly-signalled dataset.
4. Documents this in dissertation **Chapter 4 (Findings)** and **Chapter 5 (Discussion + Recommendations for Further Study)**.

This converts the dataset weakness into demonstrated scientific maturity.

---

## Pre-defense checklist

- [ ] All UI metric values render from real JSON — no hard-coded "93.2%" anywhere
- [ ] Feature count is **11** everywhere (UI, form, dissertation)
- [ ] `1_data/raw/` untouched; `clean.py` reproduces `processed/`
- [ ] All 5 OSEMN notebooks run top-to-bottom without path errors
- [ ] Flask endpoints return valid JSON; `/health` confirms model loaded
- [ ] Clerk auth flow works; `/admin` blocked for non-admin
- [ ] Next.js builds without errors; responsive on mobile
- [ ] VPS: HTTPS works, API responds, pages load (warm up before defense)
- [ ] `DEFENSE_QA.md` complete, incl. dataset-honesty answer
- [ ] Dissertation ≥ 20,000 words, formatting compliant, abstract written last
