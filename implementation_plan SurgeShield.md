# SurgeShield — AI-Powered Flood Prediction & Analytics System

> **Student:** Final Year Software Engineering, ICT University, Cameroon  
> **Goal:** Production-grade, deployed flood prediction system worthy of an A-grade defense  
> **Dataset:** `flood_risk_dataset_india.csv` (10,000 real-world flood observations)

---

## 1. Dataset Strategy

### Using: `flood_risk_dataset_india.csv` (10,000 rows × 14 columns)

**Features used for ML model (12 features — lat/lon excluded):**

| Feature | Type | Description |
|---------|------|-------------|
| Rainfall (mm) | Numeric | Precipitation amount |
| Temperature (°C) | Numeric | Air temperature |
| Humidity (%) | Numeric | Atmospheric humidity |
| River Discharge (m³/s) | Numeric | Water flow rate in rivers |
| Water Level (m) | Numeric | Current water level |
| Elevation (m) | Numeric | Terrain height above sea level |
| Land Cover | Categorical | Water Body, Forest, Agricultural, Urban, Desert |
| Soil Type | Categorical | Clay, Sandy, Loam, Peat, Silt |
| Population Density | Numeric | People per area |
| Infrastructure | Binary | Infrastructure present (1) or not (0) |
| Historical Floods | Binary | Past flood history (1) or not (0) |

**Target:** `Flood Occurred` — Binary classification (0 = No Flood, 1 = Flood)

**Lat/Lon:** Excluded from model features to prevent geographic overfitting. Retained only for map visualization of training data.

---

## 2. System Architecture

```
┌────────────────────────────── VPS ──────────────────────────────┐
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              Nginx (Reverse Proxy + SSL)                │     │
│  │  surgeshield.com        → Next.js (port 3000)           │     │
│  │  surgeshield.com/ml-api → Flask ML API (port 5000)      │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────────┐       │
│  │   Next.js App        │    │   Python Flask ML API    │       │
│  │   (PM2)              │    │   (Gunicorn)             │       │
│  │                      │    │                          │       │
│  │ • Landing page       │    │ POST /predict            │       │
│  │ • Dashboard          │    │ GET  /model-info         │       │
│  │ • Prediction form    │    │ GET  /analytics          │       │
│  │ • Map view           │    │ GET  /health             │       │
│  │ • Analytics          │    │                          │       │
│  │ • History            │    │ Models: RF, XGB, LR,     │       │
│  │ • Admin panel        │    │         SVM, GB          │       │
│  └──────────┬───────────┘    └──────────────────────────┘       │
│             │                                                    │
└─────────────┼────────────────────────────────────────────────────┘
              │ API calls (auth + data)
    ┌─────────▼──────────┐
    │  Cloud Services     │
    │  • Clerk (auth)     │
    │  • Convex (database)│
    └────────────────────┘
```

**Data Flow:**
1. User visits `surgeshield.com` → Nginx serves the Next.js app
2. User signs in via **Clerk** (managed auth)
3. User fills the prediction form with environmental parameters
4. Next.js calls a **Convex action** → action calls the **Flask ML API** (same VPS, port 5000)
5. Flask loads the trained model, returns prediction + probability + top factors
6. Convex **stores** the prediction in the database (history)
7. Frontend displays animated result — gauge, risk level, contributing factors
8. Admin users see a separate panel with system-wide metrics and user management

---

## 3. Implementation Plan

---

### Phase 1: ML Pipeline (`ml-api/`)

#### [NEW] `ml-api/requirements.txt`
```
flask
flask-cors
gunicorn
pandas
numpy
scikit-learn
xgboost
joblib
```

#### [NEW] `ml-api/train.py`
Training script:
1. Load `flood_risk_dataset_india.csv`
2. Drop `Latitude`, `Longitude` from features
3. Encode categoricals: `Land Cover` → One-Hot Encoding, `Soil Type` → One-Hot Encoding
4. Scale numerics with `StandardScaler`
5. Train/test split: 80/20, stratified on target
6. Train **5 models**:
   - Logistic Regression (baseline)
   - Random Forest Classifier
   - XGBoost Classifier
   - Gradient Boosting Classifier
   - Support Vector Machine (SVM)
7. Evaluate each with: Accuracy, Precision, Recall, F1-Score, ROC-AUC
8. Generate: confusion matrices, ROC curves, feature importances
9. Select best model by F1-Score
10. Save: `best_model.joblib`, `scaler.joblib`, `encoder.joblib`, `metrics.json`, `feature_importances.json`, `all_models_comparison.json`

#### [NEW] `ml-api/app.py` (Flask REST API)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | POST | Takes 12 environmental params → returns `{flood: bool, probability: float, risk_level: str, top_factors: [...]}` |
| `/model-info` | GET | Returns model name, accuracy, F1, ROC-AUC, training date, feature count |
| `/analytics` | GET | Returns all 5 model comparison metrics, confusion matrix data, ROC curve data, feature importances |
| `/health` | GET | Returns `{status: "ok", model_loaded: true}` |

#### [NEW] `ml-api/models/` — Directory for saved `.joblib` model files and `.json` metric files

---

### Phase 2: Convex Backend (`convex/`)

#### [NEW] `convex/schema.ts`
```
predictions table:
  - userId (string, indexed)
  - inputs (object: all 12 environmental params)
  - result (boolean: flood or no flood)
  - probability (float: 0-1)
  - riskLevel (string: "Low" | "Moderate" | "High" | "Critical")
  - topFactors (array of {feature, contribution})
  - latitude (optional float)
  - longitude (optional float)
  - locationName (optional string)
  - createdAt (number, indexed)

savedLocations table:
  - userId (string, indexed)
  - name (string)
  - latitude (float)
  - longitude (float)
  - lastRiskLevel (string)
  - lastChecked (number)

systemStats table:
  - totalPredictions (number)
  - totalUsers (number)
  - floodDetectedCount (number)
  - lastUpdated (number)
```

#### [NEW] `convex/predictions.ts`
- `savePrediction(mutation)` — Store a prediction result linked to userId
- `getUserPredictions(query)` — Paginated prediction history for the logged-in user
- `getRecentPredictions(query)` — Latest 10 predictions (dashboard feed)
- `getAllPredictions(query)` — Admin only: all predictions system-wide
- `getPredictionStats(query)` — Aggregated stats (total, flood count, no-flood count)

#### [NEW] `convex/locations.ts`
- `saveLocation(mutation)` — Save a monitored location for a user
- `getUserLocations(query)` — Get user's saved locations
- `deleteLocation(mutation)` — Remove a saved location
- `getAllLocations(query)` — Admin only: all saved locations across users

#### [NEW] `convex/actions/predict.ts`
Convex HTTP action:
1. Receive environmental parameters from the frontend
2. Call the Flask ML API at `http://localhost:5000/predict` (same VPS)
3. Store the result in the `predictions` table
4. Update `systemStats`
5. Return prediction to the frontend

#### [NEW] `convex/admin.ts`
- `getSystemOverview(query)` — Total users, predictions, flood rate, recent activity
- `getUserList(query)` — All registered users with prediction counts
- `getActivityFeed(query)` — Recent predictions across all users (admin feed)

---

### Phase 3: Next.js Frontend

#### Project Structure:
```
src/
├── app/
│   ├── layout.tsx          — Root layout (Clerk provider, Convex provider, nav)
│   ├── page.tsx            — Landing / hero page (public)
│   ├── sign-in/            — Clerk sign-in page
│   ├── sign-up/            — Clerk sign-up page
│   ├── dashboard/
│   │   └── page.tsx        — User dashboard (protected)
│   ├── predict/
│   │   └── page.tsx        — Prediction engine (protected)
│   ├── map/
│   │   └── page.tsx        — Interactive map view (protected)
│   ├── analytics/
│   │   └── page.tsx        — ML model analytics (protected)
│   ├── history/
│   │   └── page.tsx        — User's prediction history (protected)
│   ├── admin/
│   │   └── page.tsx        — Admin panel (admin role only)
│   └── about/
│       └── page.tsx        — About / How it works (public)
├── components/
│   ├── Navbar.tsx          — Navigation bar with Clerk UserButton
│   ├── Hero.tsx            — Landing page hero section
│   ├── PredictionForm.tsx  — The 12-field input form with sliders
│   ├── ResultDisplay.tsx   — Animated prediction result (gauge + factors)
│   ├── FloodMap.tsx        — Leaflet map component
│   ├── StatsCard.tsx       — Reusable metric card
│   ├── FeatureChart.tsx    — Feature importance bar chart
│   ├── ModelComparison.tsx — Model accuracy comparison chart
│   ├── ConfusionMatrix.tsx — Confusion matrix heatmap
│   ├── RiskGauge.tsx       — Circular risk probability gauge
│   ├── PredictionTable.tsx — History table with filters
│   └── AdminDashboard.tsx  — Admin-only system overview
└── lib/
    ├── constants.ts        — Feature names, ranges, defaults, tooltips
    └── utils.ts            — Helper functions
```

---

#### Page Breakdown:

**1. `/` — Landing Page (Public)**
- Full-screen hero with animated gradient background
- Headline: *"Predict Floods Before They Strike"*
- Global flood statistics (lives lost, economic damage per year)
- 3-step "How it Works" section with icons
- Testimonial-style section about why this matters
- "Get Started Free" CTA → Clerk sign-up
- Footer with system info

**2. `/dashboard` — User Dashboard (Protected)**
- Welcome message with user name from Clerk
- 4 stat cards: Total Predictions | Locations Monitored | High Risk Alerts | Last Prediction
- Recent predictions feed (last 5 with risk badges)
- Quick-predict shortcut button
- Saved locations mini-map

**3. `/predict` — Prediction Engine ⭐ (Protected)**
- Beautiful card-based form with **12 input fields**:
  - **Sliders** for: Rainfall, Temperature, Humidity, River Discharge, Water Level, Elevation, Population Density
  - **Dropdowns** for: Land Cover (5 options), Soil Type (5 options)
  - **Toggles** for: Infrastructure (yes/no), Historical Floods (yes/no)
- Each field has a **tooltip** explaining what it means and realistic ranges
- Smart defaults pre-filled
- Animated "Predict" button with loading state
- **Result panel** appears with animation:
  - Large circular **risk gauge** (0-100%) with color gradient (green → yellow → red)
  - **Risk level badge**: Low / Moderate / High / Critical
  - **Top 5 contributing factors** horizontal bar chart
  - "Save Location" button to bookmark this prediction
- Result auto-saved to Convex

**4. `/map` — Interactive Map (Protected)**
- Full-width Leaflet.js map (dark tile layer)
- Training data points as circle markers, color-coded:
  - 🟢 Green = No flood
  - 🔴 Red = Flood occurred
- User's saved locations as custom markers with risk badges
- Click any marker → popup with prediction details
- Legend panel explaining colors
- Layer toggle: training data / user locations / heatmap

**5. `/analytics` — Model Analytics (Protected)**
- **Model Comparison** bar chart: Accuracy of all 5 models side by side
- **Best Model** highlight card with: Accuracy, Precision, Recall, F1, ROC-AUC
- **Confusion Matrix** as a styled 2×2 heatmap grid
- **ROC Curve** line chart
- **Feature Importance** horizontal bar chart (top 12 features ranked)
- **Dataset Overview** cards: Total samples, flood/no-flood split, train/test ratio

**6. `/history` — Prediction History (Protected)**
- Sortable, filterable table of all user predictions
- Columns: Date, Risk Level, Probability, Rainfall, Key Factors
- Color-coded risk badges per row
- Click any row → expand to see full details
- "Export to CSV" button
- Pagination

**7. `/admin` — Admin Panel (Admin Role Only)**
- **System Overview**: Total users, total predictions, flood detection rate, predictions today
- **User Management Table**: Username, email, prediction count, last active, role
- **Activity Feed**: Real-time log of all predictions system-wide
- **System Health**: ML API status, model accuracy, last training date
- **Risk Heatmap**: Aggregate of all predictions showing most commonly predicted high-risk combos

**8. `/about` — About Page (Public)**
- "How SurgeShield Works" — 3-step visual flow
- System architecture diagram (simplified for non-technical audience)
- ML methodology section: what models we use and why
- "Why Flood Prediction Matters" — Cameroon and global flood statistics
- Future work roadmap
- Credits / university info

---

#### Design System:
- **Color Palette**: Deep navy (`#0a0f1e`), electric blue (`#3b82f6`), cyan accent (`#06b6d4`), danger red (`#ef4444`), success green (`#22c55e`), warning amber (`#f59e0b`)
- **Glassmorphism**: Cards with `backdrop-filter: blur(12px)`, semi-transparent backgrounds
- **Typography**: Inter (body text), Outfit (headings) — from Google Fonts
- **Animations**: Fade-in on scroll, gauge fill animation, hover scale on cards, smooth page transitions
- **Responsive**: Mobile-first, breakpoints at 640px / 768px / 1024px / 1280px
- **Dark mode**: Primary theme (dark), no light mode toggle needed

---

### Phase 4: Admin & Role-Based Access Control

**Clerk Role Setup:**
- Default role: `user` — access to dashboard, predict, map, analytics, history
- Admin role: `admin` — access to everything above PLUS the admin panel

**Implementation:**
- Clerk metadata stores `role: "admin"` on admin users
- Next.js middleware checks role before rendering `/admin` routes
- Convex queries for admin data check `userId` against admin role
- You (the developer) are the admin — set via Clerk dashboard

**Why Admin Matters for Defense:**
> *"SurgeShield implements role-based access control. Regular users predict and monitor floods for their locations. Administrators oversee the entire platform — monitoring prediction patterns, managing users, and broadcasting flood alerts. This is industry-standard SaaS architecture."*

---

### Phase 5: VPS Deployment

#### Server Setup (Ubuntu 22.04 VPS):
```bash
# 1. Install system dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install nginx python3 python3-pip python3-venv nodejs npm -y
npm install -g pm2

# 2. Clone project
git clone <repo-url> /var/www/surgeshield
cd /var/www/surgeshield

# 3. Setup Python ML API
cd ml-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python train.py                    # Train model and save artifacts
gunicorn app:app -b 0.0.0.0:5000 --daemon

# 4. Setup Next.js
cd ../frontend
npm install
npm run build
pm2 start npm --name "surgeshield" -- start

# 5. Setup Convex
npx convex deploy

# 6. Configure Nginx
# (see config below)

# 7. SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d surgeshield.com
```

#### [NEW] `deployment/nginx.conf`
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

    # Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Python ML API
    location /ml-api/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Environment Variables (`.env`):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
ML_API_URL=http://localhost:5000
```

---

## 4. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14+ (React) | Server-side rendered pages, routing |
| **Authentication** | Clerk | User signup/login, role management |
| **Database** | Convex | Real-time data storage, serverless functions |
| **ML API** | Python + Flask | Serve trained ML model predictions |
| **ML Training** | scikit-learn, XGBoost | Model training and evaluation |
| **Data Processing** | pandas, numpy | Dataset loading and transformation |
| **Charts** | Recharts | React-native charting library |
| **Maps** | react-leaflet (Leaflet.js) | Interactive map visualization |
| **Model Storage** | joblib | Serialize trained models |
| **Web Server** | Nginx | Reverse proxy, SSL termination |
| **Process Manager** | PM2 + Gunicorn | Keep Node.js and Python running |
| **VPS** | Ubuntu 22.04 | Production server |
| **SSL** | Let's Encrypt (Certbot) | HTTPS |

---

## 5. Defense-Winning Points

| Feature | What You Tell the Jury |
|---------|----------------------|
| **5 ML models compared** | *"I evaluated multiple algorithms scientifically and selected the best performer by F1-Score"* |
| **Microservices architecture** | *"The ML model runs as an independent API service — proper separation of concerns"* |
| **Role-based access control** | *"Admin and user roles with Clerk — industry-standard SaaS security"* |
| **Real-time database** | *"Convex provides real-time sync — predictions appear instantly across devices"* |
| **Lat/Lon excluded from model** | *"I prevented geographic overfitting to ensure the model generalizes globally"* |
| **Feature importance analysis** | *"I can explain exactly WHICH factors drive each prediction — model interpretability"* |
| **VPS deployment with SSL** | *"Deployed on a production server with HTTPS — not just a localhost demo"* |
| **Interactive map** | *"Visual risk mapping — practical for disaster response teams"* |
| **Prediction history** | *"Users track risk over time — enables temporal pattern recognition"* |
| **Admin panel** | *"System administrators can monitor platform-wide flood patterns and manage users"* |
| **Responsive design** | *"Works on mobile — critical for communities and field workers"* |

---

## 6. Verification Plan

### Automated
- [ ] ML model accuracy > 85% on test set (all 5 models)
- [ ] All Flask API endpoints return valid JSON
- [ ] Convex schema deploys without errors
- [ ] Clerk auth flow works (sign-up, sign-in, sign-out)
- [ ] Admin role restriction works (non-admin can't access `/admin`)
- [ ] Next.js builds without errors

### Manual
- [ ] Full user journey: Sign up → Dashboard → Predict → View result → Map → History → Analytics
- [ ] Admin journey: Login as admin → View system stats → See user list → Activity feed
- [ ] Test prediction with edge values (0 rainfall, extreme rainfall)
- [ ] Test responsive layout on mobile viewport
- [ ] Verify VPS deployment: HTTPS works, API responds, pages load

### Defense Prep
- [ ] Generate Defense Q&A document (30+ likely questions with answers)
- [ ] Practice 5-minute demo walkthrough
- [ ] Prepare system architecture slide
- [ ] Warm up VPS before defense (hit the API to ensure no cold start)

---

## Open Questions

> [!IMPORTANT]
> **Please confirm before I start building:**
> 1. **Do you have Python 3.8+ installed?** (Run `python --version` to check)
> 2. **Do you have Node.js 18+ installed?** (Run `node --version` to check)
> 3. **Do you already have Clerk and Convex accounts?** (Both are free to create)
> 4. **Have you purchased a VPS yet?** Or should we develop locally first and deploy later?
