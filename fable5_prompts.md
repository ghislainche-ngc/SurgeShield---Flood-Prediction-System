# SurgeShield — Fable 5 UI Design Prompts

> **Design DNA (extracted from your references):**
> - Clean sidebar navigation with icon + text labels
> - Card-based dashboard layouts with stat widgets
> - Integrated map panels alongside data lists
> - Earthy/nature-inspired palette (deep greens, teals, warm neutrals) — NOT generic blue tech
> - Generous whitespace, rounded corners, soft shadows
> - Full-width hero with nature photography backgrounds
> - Process/step sections with numbered cards
> - Professional SaaS feel — clean, not cluttered

---

## PROMPT 1: Landing Page (Public)

```
Design a full-page landing page for "SurgeShield" — an AI-powered flood prediction web application. The design should feel environmental, authoritative, and human-centered.

HERO SECTION:
- Full-width background: aerial drone photograph of a flooded landscape with submerged houses and roads, overlaid with a dark gradient (70% opacity) from top
- Navigation bar at top: Logo "SurgeShield" (shield icon with water wave) on the left, menu items "About", "How It Works", "Features", "Contact" in the center, and a green "Get Started" button on the right
- Small tag line above the headline in green badge: "[AI-Powered Flood Intelligence]"
- Large headline in white bold serif font: "Predict Floods Before They Strike"
- Subtitle text in light gray: "SurgeShield uses machine learning to analyze environmental data — rainfall, river levels, elevation, soil type — and predicts flood risk in real-time. Protecting communities, saving lives."
- Two buttons side by side: "Start Predicting" (filled green) and "Learn More" (outlined white)
- Below the buttons: a row showing "10,000+ Data Points Analyzed · 93.2% Prediction Accuracy · 5 ML Models Compared"

TRUSTED BY / STATS SECTION:
- Light background section
- Three large stat cards in a row:
  - "2.3 Billion" — People affected by floods globally (1998-2017)
  - "$82 Billion" — Annual global flood damage
  - "93.2%" — SurgeShield's prediction accuracy
- Source attribution: "Data: WHO, World Bank, SurgeShield ML Pipeline"

HOW IT WORKS SECTION:
- Heading: "How SurgeShield Works"
- Subtitle: "Three simple steps from data to protection"
- Three numbered cards [01], [02], [03] in a row:
  - [01] "Input Environmental Data" — icon: form/clipboard — "Enter rainfall, temperature, river discharge, elevation, soil type and other parameters for your location"
  - [02] "AI Analyzes & Predicts" — icon: brain/circuit — "Our XGBoost model processes your data against 10,000 training observations to classify flood risk"
  - [03] "Get Actionable Results" — icon: shield/check — "Receive flood probability, risk level, and the top contributing factors driving the prediction"

FEATURES SECTION:
- Dark green/teal background with subtle topographic line pattern
- Heading: "Designed to live across the modern disaster response world"
- 2x2 grid of feature cards with glassmorphism:
  - "Prediction Engine" — "12-parameter input form with intelligent defaults and real-time ML prediction"
  - "Interactive Risk Map" — "Visualize flood-prone zones with color-coded markers on a dark-themed Leaflet map"
  - "Analytics Dashboard" — "Compare 5 ML models, view confusion matrices, ROC curves, and feature importance"
  - "Role-Based Access" — "Citizen monitoring and administrator oversight with Clerk authentication"

VALUES/PRINCIPLES SECTION:
- Light background
- Heading: "Grounded in clearer standards"
- Four cards in a row:
  - "Open Data" — "Built on publicly available environmental datasets"
  - "Transparent AI" — "Every prediction explains which factors drove the result"
  - "Global Transferability" — "Model trained on universal physics — works across geographies"
  - "Production Deployed" — "HTTPS, VPS, Nginx — not just a research prototype"

CTA SECTION:
- Gradient green/teal background
- Heading: "Ready to protect any community, anywhere?"
- Subtitle: "Start predicting flood risk for free with SurgeShield"
- Two buttons: "Get Started" (white filled) and "View Documentation" (outlined)

FOOTER:
- Dark background
- Logo, links, "© 2026 SurgeShield · Global Flood Intelligence"

Color palette: Deep forest green (#1a3a2a), teal (#0d9488), warm cream (#faf7f2), white, dark charcoal (#1c1c1c). Typography: serif font for headings (like Playfair Display), clean sans-serif for body (like Inter). Rounded corners on cards, soft shadows, generous whitespace. Nature-inspired, premium, environmental feel — NOT generic tech blue.
```

---

## PROMPT 2: Sign In / Sign Up Page

```
Design a sign-in and sign-up authentication page for "SurgeShield" — an AI-powered flood prediction system.

LAYOUT: Split screen — 50/50

LEFT PANEL (Visual):
- Full-height background: dark-toned aerial photograph of a river delta or floodplain with visible water channels, overlaid with a dark green gradient
- SurgeShield logo (shield + wave icon) in white at the top left
- Large quote in white text: "Every prediction is a chance to protect a life."
- Below: "Powered by XGBoost · 93.2% Accuracy · 10,000+ Training Observations"
- Bottom: a subtle 3D topographic map visualization or contour lines as a decorative element

RIGHT PANEL (Form):
- Clean white/cream background
- Heading: "Welcome back" (for sign-in) or "Create your account" (for sign-up)
- Subtitle: "Sign in to access your flood prediction dashboard"
- Input fields with rounded borders and soft shadows:
  - Email address (with mail icon)
  - Password (with lock icon and show/hide toggle)
  - For sign-up: Full name, Confirm password
- "Sign In" button — filled green (#0d9488), full width, rounded
- Divider: "or continue with"
- Social login buttons: Google, GitHub (outlined, icon-only)
- Bottom text: "Don't have an account? Sign up" (with link)

Clean, minimal, premium feel. Forest green and cream color palette. Rounded corners, no harsh borders. Serif heading font, sans-serif body.
```

---

## PROMPT 3: User Dashboard (Protected)

```
Design a user dashboard page for "SurgeShield" — an AI-powered flood prediction system. This is the main page users see after logging in.

LAYOUT: Sidebar + main content area

LEFT SIDEBAR (fixed, 250px wide):
- Dark charcoal background (#1c1c1c) or deep forest green (#1a3a2a)
- Logo at top: "SurgeShield" with shield+wave icon in teal
- Navigation items with icons (each item has icon + text label):
  - 🏠 Dashboard (active — highlighted with teal background pill)
  - 🎯 Predict
  - 🗺️ Map View
  - 📊 Analytics
  - 📋 History
  - ℹ️ About
- Separator line
- Section label: "ACCOUNT"
  - ⚙️ Settings
  - 🚪 Sign Out
- Bottom of sidebar: User avatar circle, name "Ghislain N.", email below, small green "online" dot

MAIN CONTENT AREA (right side, light cream background):
- Top bar: "Dashboard" heading on left, "Good evening, Ghislain" greeting, small notification bell icon on right
- TOP ROW — 4 stat cards in a row (rounded, white, soft shadow):
  - Card 1: "Total Predictions" — large number "24" — small green up arrow "↑ 12% this week" — icon: target/crosshair in teal circle
  - Card 2: "Locations Monitored" — "3" — icon: map pin in blue circle
  - Card 3: "High Risk Alerts" — "5" — icon: warning triangle in red/amber circle
  - Card 4: "Prediction Accuracy" — "93.2%" — icon: checkmark in green circle

- MIDDLE ROW — Two panels side by side:
  LEFT PANEL: "Recent Predictions" — A list/table of last 5 predictions:
    Each row shows: Location name or coordinates, Date, Risk Level badge (color-coded: green "Low", amber "Moderate", red "High", dark red "Critical"), Probability percentage
    Example rows:
    - "Bangkok, Thailand" — Jun 12, 2026 — 🔴 High — 87%
    - "Houston, Texas" — Jun 11, 2026 — 🟡 Moderate — 54%
    - "Zurich, Switzerland" — Jun 10, 2026 — 🟢 Low — 18%
    Bottom: "View All History →" link

  RIGHT PANEL: "Quick Predict" — A compact call-to-action card:
    - Small illustration or icon of a weather/rain element
    - Text: "Run a new flood prediction"
    - Subtitle: "Enter environmental data to assess flood risk for any location"
    - Green button: "Start Prediction →"

- BOTTOM ROW: "Saved Locations" — Mini map (small Leaflet map, 400px tall) showing 3 pinned locations with colored markers, next to a list of saved locations with their last-known risk level

Color palette: Deep forest green sidebar, cream/off-white main area, teal accents, white cards with rounded corners and soft shadows. Clean, professional, data-dashboard aesthetic similar to the AeuxGlobal reference. Serif headings, Inter/sans-serif body text.
```

---

## PROMPT 4: Prediction Engine — Input Form

```
Design the flood prediction form page for "SurgeShield" — the core feature where users input environmental parameters to get an AI-powered flood prediction.

LAYOUT: Sidebar (same as dashboard) + main content area

MAIN CONTENT:
- Top: Breadcrumb "Dashboard > Predict" and heading "Flood Prediction Engine"
- Subtitle: "Enter environmental parameters below. Our XGBoost model will analyze the data and predict flood risk."

FORM LAYOUT — Two-column card grid on cream/white background:

LEFT COLUMN — "Environmental Parameters" card (white, rounded, soft shadow):
- Section: "Weather & Hydrology"
  - Rainfall (mm): Slider from 0 to 500, current value displayed "250 mm", with subtle raindrop icon
  - Temperature (°C): Slider from 0 to 50, showing "32°C", thermometer icon
  - Humidity (%): Slider from 20 to 100, showing "78%", water droplet icon
  - River Discharge (m³/s): Number input showing "4,500", river icon
  - Water Level (m): Slider from 0 to 15, showing "8.2m", waves icon

- Section: "Terrain & Geography"
  - Elevation (m): Slider from 0 to 9000, showing "120m", mountain icon
  - Land Cover: Dropdown selector showing "Agricultural" with options: Water Body, Forest, Agricultural, Urban, Desert — each option with a small colored dot
  - Soil Type: Dropdown selector showing "Clay" with options: Clay, Sandy, Loam, Peat, Silt

RIGHT COLUMN — "Demographics & History" card:
- Section: "Population & Infrastructure"
  - Population Density: Number input showing "5,200", people icon
  - Infrastructure Present: Toggle switch (ON/OFF) — currently showing ON with green indicator
  - Historical Floods: Toggle switch — currently showing ON with amber indicator

- Section: "Location (Optional)"
  - Location Name: Text input "Bangkok, Thailand"
  - A small inline map where user can click to set lat/lng coordinates
  - "Use my current location" link with GPS icon

BOTTOM: Full-width green button "🔍 Analyze Flood Risk" — large, rounded, with subtle pulse animation indicator

Each input field has a small (i) tooltip icon that explains what the parameter means and a realistic range.

Design: Clean, spacious, organized. White cards on cream background. Teal/green accents. Each slider has a colored track (gradient from green to red). Professional form design — not cluttered. Feels like filling out a scientific instrument, not a generic web form.
```

---

## PROMPT 5: Prediction Results Display

```
Design the prediction results panel for "SurgeShield" that appears after a user submits the flood prediction form. This is the moment of truth — the design should feel dramatic and informative.

LAYOUT: Sidebar (same) + main content showing the result

THE RESULT — displayed as a large centered card/modal that appears with animation:

TOP SECTION of result card:
- A large circular gauge/dial in the center, showing 87% filled
- The gauge arc gradient goes from green (0%) through yellow (50%) to red (100%)
- Inside the gauge circle: large "87%" text in bold, below it "Flood Probability"
- Below the gauge: A prominent badge/pill: "⚠️ HIGH RISK" in red/orange background with white text
- Subtitle: "Based on the environmental parameters provided, our XGBoost model predicts a HIGH flood risk for this location."

MIDDLE SECTION — "Contributing Factors" card:
- Heading: "Why this prediction?" with a lightbulb icon
- Horizontal bar chart showing top 5 contributing factors:
  - Rainfall (mm) ████████████████ 32%
  - River Discharge ██████████████ 25%
  - Water Level ██████████ 18%
  - Elevation ████████ 12%
  - Humidity ██████ 8%
- Each bar has a gradient fill (teal to green)
- Small text: "Feature importance from XGBoost model — higher values indicate greater influence on the prediction"

BOTTOM SECTION — Action buttons row:
- "📍 Save This Location" — outlined teal button
- "🔄 New Prediction" — outlined gray button
- "📤 Share Results" — outlined gray button
- "📥 Download Report" — outlined gray button

SIDE INFO PANEL (right side):
- "Prediction Details" card:
  - Input Summary: Rainfall: 250mm, Temperature: 32°C, River Discharge: 4,500 m³/s... (compact list of all 12 inputs)
  - Model: XGBoost Classifier
  - Confidence: 87.3%
  - Timestamp: June 13, 2026 — 01:45 AM
  - Prediction ID: #SRG-2026-0247

Design: The gauge should be the visual centerpiece — large, dramatic, impossible to miss. The contributing factors chart provides interpretability. The color scheme should adapt to the risk level (green tones for Low, amber for Moderate, red/orange for High, dark red for Critical). Premium, clean, data-rich but not overwhelming.
```

---

## PROMPT 6: Interactive Map View

```
Design an interactive map page for "SurgeShield" — showing flood risk data visualized geographically.

LAYOUT: Sidebar navigation (same as other pages) + full-width map with an overlay panel

MAP AREA:
- A large dark-themed map (similar to Mapbox Dark or CartoDB Dark Matter tiles) taking up the full width and height of the content area
- Scattered across the map: hundreds of small circular markers:
  - Green circles: locations where no flood occurred (safe zones)
  - Red circles: locations where flood occurred (danger zones)
  - A few larger custom markers in teal/blue: user's saved locations with a small shield icon
- One marker is clicked/selected, showing a popup card:
  - "Jakarta, Indonesia"
  - "Risk Level: HIGH"
  - "Last Prediction: 87% probability"
  - "Rainfall: 250mm | River: 4,500 m³/s"
  - "Predicted: Jun 13, 2026"
  - Button: "View Full Details"

LEFT OVERLAY PANEL (floating on top of the map, semi-transparent dark background with backdrop blur):
- Top: "Flood Risk Map" heading
- Search bar: "Search location..." with search icon
- Layer toggles:
  - ☑ Training Data Points (10,000)
  - ☑ My Saved Locations (3)
  - ☐ Risk Heatmap
- Separator
- "My Saved Locations" list:
  - 📍 Jakarta, Indonesia — 🔴 High Risk
  - 📍 Houston, Texas — 🟡 Moderate
  - 📍 Zurich, Switzerland — 🟢 Low Risk
- Separator
- LEGEND:
  - 🟢 No Flood Risk
  - 🟡 Moderate Risk
  - 🔴 High Flood Risk
  - 🔵 Your Saved Locations

BOTTOM BAR (floating, rounded):
- "Showing 10,000 data points from training dataset"
- Zoom controls: + and - buttons
- "📍 Go to My Locations" button

Design: The map dominates the view. The overlay panel is sleek and doesn't obstruct the map. Dark theme map with vibrant colored markers creates contrast. Similar to the package-tracking reference image with the left panel + map layout, but adapted for flood data. The popup cards on marker click should be clean with key info and risk-level color coding.
```

---

## PROMPT 7: Analytics Dashboard

```
Design an analytics dashboard page for "SurgeShield" showing machine learning model performance metrics and data insights.

LAYOUT: Sidebar (same) + main content area with cream/off-white background

TOP ROW — "Best Model" highlight section:
- A banner card with subtle green gradient background:
  - Left side: "🏆 Best Performing Model"
  - Center: "XGBoost Classifier" in large bold text
  - Right side: 4 small metric pills: "Accuracy: 93.2%" | "F1: 0.933" | "ROC-AUC: 0.974" | "Recall: 94.5%"

SECOND ROW — "Model Comparison" (full width):
- White card with heading "Model Performance Comparison"
- A grouped bar chart comparing 5 models across 5 metrics:
  - Models on X-axis: Logistic Regression, Random Forest, XGBoost (highlighted in teal), Gradient Boosting, SVM
  - Bars for: Accuracy, Precision, Recall, F1-Score, ROC-AUC
  - XGBoost bars are teal/green, others are in muted gray/neutral tones
  - Clear value labels on top of each bar
- Below the chart: A comparison table with exact numbers for all 5 models × 5 metrics

THIRD ROW — Two cards side by side:

LEFT CARD: "Confusion Matrix" — XGBoost
- A styled 2×2 grid heatmap:
  - Top-left (TN): 912 — light green background
  - Top-right (FP): 68 — light red background
  - Bottom-left (FN): 56 — light red background
  - Bottom-right (TP): 964 — dark green background
- Row labels: "Actual: No Flood", "Actual: Flood"
- Column labels: "Predicted: No Flood", "Predicted: Flood"
- Caption: "XGBoost achieved 964 correct flood detections with only 56 missed events"

RIGHT CARD: "ROC Curve"
- Line chart with 5 colored curves (one per model)
- Diagonal dashed line (random baseline)
- XGBoost curve in bold teal, closest to top-left corner
- Legend showing each model name and its AUC value
- Axes: "False Positive Rate" (x) and "True Positive Rate" (y)

FOURTH ROW — Two cards side by side:

LEFT CARD: "Feature Importance" (Top 10)
- Horizontal bar chart:
  - Rainfall (mm) ████████████████████ 0.187
  - River Discharge ████████████████ 0.156
  - Water Level ██████████████ 0.142
  - Elevation ████████████ 0.118
  - Humidity ██████████ 0.094
  - Population Density ████████ 0.068
  - Temperature ██████ 0.055
  - Historical Floods █████ 0.048
  - Infrastructure ████ 0.035
  - Land Cover: Water Body ███ 0.028
- Bars in gradient from dark teal to light green
- Caption: "Rainfall, River Discharge, and Water Level account for 48.5% of total feature importance"

RIGHT CARD: "Dataset Overview"
- Three stat widgets:
  - "Total Samples: 10,000"
  - "Flood Events: 5,100 (51%)" with a small donut chart
  - "Non-Flood: 4,900 (49%)"
- "Train/Test Split: 80% / 20% (Stratified)"
- "Features Used: 12 (Geographic coordinates excluded)"
- Small text: "Cross-validation: 5-Fold, Mean Accuracy: 93.0% ± 0.2%"

Design: Similar to the AeuxGlobal dashboard reference — clean white cards on cream background, organized grid layout, data-rich but spacious. Teal/green color accents. Each chart should feel like a premium data visualization, not a default chart library output. Professional, academic quality — suitable for inclusion in a dissertation report.
```

---

## PROMPT 8: Prediction History

```
Design a prediction history page for "SurgeShield" showing a user's past flood predictions in a table format.

LAYOUT: Sidebar (same) + main content

TOP BAR:
- Heading: "Prediction History"
- Subtitle: "Track and review all your past flood predictions"
- Right side: "📥 Export CSV" button (outlined) and a filter icon button

FILTER BAR (below heading):
- Horizontal row of filter pills:
  - "All Predictions" (active, teal background)
  - "High Risk" (outlined, red dot)
  - "Moderate" (outlined, amber dot)
  - "Low Risk" (outlined, green dot)
- Date range picker: "Jun 1 — Jun 13, 2026"
- Search input: "Search by location..."
- Sort dropdown: "Newest first"

DATA TABLE (white card, rounded, full width):
- Table headers: # | Date & Time | Location | Risk Level | Probability | Key Factor | Actions
- Table rows with alternating subtle gray/white backgrounds:
  Row 1: #247 | Jun 13, 01:45 AM | Bangkok, Thailand | 🔴 HIGH (red badge) | 87.3% | Rainfall (250mm) | 👁️ View | 🗑️ Delete
  Row 2: #246 | Jun 12, 04:22 PM | Houston, Texas | 🟡 MODERATE (amber badge) | 54.1% | River Discharge | 👁️ View | 🗑️ Delete
  Row 3: #245 | Jun 12, 10:15 AM | Zurich, Switzerland | 🟢 LOW (green badge) | 18.4% | Elevation (1,200m) | 👁️ View | 🗑️ Delete
  Row 4: #244 | Jun 11, 09:30 PM | Mumbai, India | 🔴 CRITICAL (dark red badge) | 94.7% | Water Level (12.3m) | 👁️ View | 🗑️ Delete
  Row 5: #243 | Jun 11, 02:18 PM | Nairobi, Kenya | 🟢 LOW (green badge) | 12.8% | Elevation (750m) | 👁️ View | 🗑️ Delete
  ... (8-10 rows visible)

EXPANDED ROW (show one row expanded, like row #247):
- Expanded section below the row showing:
  - All 12 input parameters in a 3-column mini-grid
  - Contributing factors bar chart (compact)
  - "Model: XGBoost | Confidence: 87.3%"
  - "Predicted: Jun 13, 2026 01:45 AM"

PAGINATION BAR (bottom):
- "Showing 1-10 of 24 predictions"
- Page buttons: ← 1 2 3 →

SUMMARY STATS (small cards above table):
- "Total: 24" | "High Risk: 5" | "Moderate: 8" | "Low Risk: 11" | "Average Probability: 42.3%"

Design: Clean data table design. Risk level badges are the visual anchor — use strong color coding. Expandable rows give detail without clutter. Similar to the TenTrucks vehicle history reference — timeline/list view with clear data hierarchy. White cards, cream background, teal accents for active states.
```

---

## PROMPT 9: Admin Panel

```
Design an admin dashboard page for "SurgeShield" that only system administrators can access. This page provides a bird's-eye view of the entire platform.

LAYOUT: Sidebar (same, but with "Admin" menu item highlighted in teal, and a small "Admin" badge next to the user avatar at the bottom) + main content

TOP SECTION — "System Overview" heading with a small "🔒 Admin Access" badge

STAT CARDS ROW — 5 cards:
- Card 1: "Total Users" — "156" — 👥 icon — "↑ 12 this week" in green
- Card 2: "Total Predictions" — "1,847" — 🎯 icon — "↑ 89 this week" in green
- Card 3: "Flood Detection Rate" — "34.2%" — ⚡ icon — "634 floods detected"
- Card 4: "Predictions Today" — "23" — 📊 icon — small sparkline chart
- Card 5: "API Health" — "✅ Online" — 🟢 green dot — "Response: 142ms"

SECOND ROW — Two panels:

LEFT PANEL: "User Management" (60% width)
- White card with heading "Registered Users"
- Search bar and filter
- Table:
  Header: Avatar | Name | Email | Role | Predictions | Last Active | Status
  Row 1: 👤 | Ghislain N. | ghis***@gmail.com | 🛡️ Admin (teal badge) | 24 | 2 min ago | 🟢 Online
  Row 2: 👤 | Marie K. | mar***@yahoo.com | 👤 User | 18 | 1 hr ago | 🟢 Online
  Row 3: 👤 | Paul E. | pau***@gmail.com | 👤 User | 45 | 3 hrs ago | ⚪ Offline
  Row 4: 👤 | Sandra T. | san***@ictu.edu | 👤 User | 7 | 1 day ago | ⚪ Offline
  ... (6-8 rows)
- Pagination at bottom

RIGHT PANEL: "System Health" (40% width)
- White card showing:
  - ML API Status: 🟢 Online — "XGBoost model loaded"
  - Model Accuracy: 93.2% — small bar
  - Last Model Training: "Jun 10, 2026"
  - Avg API Response Time: "142ms" — small line chart showing last 24hrs
  - Server Uptime: "99.8%" — "12 days, 4 hours"
  - Database Status: 🟢 Convex Connected

THIRD ROW — "Activity Feed" (full width):
- White card with heading "Recent Platform Activity"
- Timeline-style feed (similar to GitHub activity feed):
  - 🔴 2 min ago — Alex R. predicted HIGH RISK (87%) for Bangkok, Thailand
  - 🟡 15 min ago — Maria S. predicted MODERATE RISK (54%) for Houston, Texas
  - 🟢 1 hr ago — James W. predicted LOW RISK (12%) for London, UK
  - 📍 1 hr ago — Priya K. saved location "Mumbai, India"
  - 🔴 2 hrs ago — Carlos M. predicted CRITICAL RISK (95%) for Jakarta, Indonesia
  - 👤 3 hrs ago — New user registered: Yuki T.
  ... (10 entries with scrolling)
- Each entry has: colored risk dot, timestamp, user name, action description

BOTTOM ROW: "Prediction Trends" (full width):
- A line chart showing number of predictions per day over the last 30 days
- A second line (dashed red) showing number of HIGH/CRITICAL risk predictions per day
- Legend: "All Predictions" (teal) and "High/Critical Risk" (red)

Design: This is the command center — should feel powerful and data-rich, like a monitoring dashboard. Similar to the AeuxGlobal reference with its stat cards and organized panels. Dark sidebar with the "Admin" item glowing in teal. Clean white cards on cream background. The activity feed should feel live and real-time. Color-coded risk badges throughout.
```

---

## PROMPT 10: About / How It Works Page (Public)

```
Design an "About" page for "SurgeShield" — a public page explaining how the system works, its methodology, and its mission.

LAYOUT: No sidebar (public page) — full-width page with top navigation bar

NAVIGATION BAR:
- Logo "SurgeShield" on left, menu items "Home", "About" (active, underlined), "Features", "Contact", and "Sign In" button on right

HERO SECTION:
- Background: A soft-focus photograph of a river landscape at golden hour, with dark overlay gradient
- Heading: "How SurgeShield Works"
- Subtitle: "From raw environmental data to life-saving predictions — powered by machine learning"

SECTION 1: "The Problem"
- Split layout: text on left, image on right (photo of flooded village or displaced people)
- Text: "Flooding affects 250 million people annually. From Bangkok to Houston, Jakarta to Lagos — communities worldwide face recurrent flooding with minimal early warning. Traditional hydrological models require expensive infrastructure and expertise. SurgeShield changes that."

SECTION 2: "Our Methodology" — 3 step visual flow
- A horizontal pipeline/flow diagram:
  Step 1: "Data Collection" — icon: database — "10,000 real-world flood observations with 12 environmental features"
  → Arrow →
  Step 2: "Model Training" — icon: brain — "5 ML algorithms compared: Logistic Regression, Random Forest, XGBoost, Gradient Boosting, SVM"
  → Arrow →
  Step 3: "Deployment" — icon: rocket — "Best model (XGBoost, 93.2%) served via REST API on a production VPS"

SECTION 3: "The Technology Stack"
- Clean grid showing technology logos/icons with labels:
  Row 1: Python | Flask | scikit-learn | XGBoost
  Row 2: Next.js | React | Convex | Clerk
  Row 3: Leaflet.js | Recharts | Nginx | Let's Encrypt
- Each with a one-line description

SECTION 4: "Why It Matters"
- Heading: "Aligned with Global Goals"
- Two cards showing UN SDG icons:
  - SDG 11: "Sustainable Cities and Communities" — "Building resilience to natural disasters"
  - SDG 13: "Climate Action" — "Strengthening adaptive capacity to climate-related hazards"
- Text: "SurgeShield demonstrates that AI-powered disaster prediction can be made accessible, interpretable, and deployable anywhere in the world — from developed nations to underserved communities."

SECTION 5: "The Team"
- Small section with: "Built as a final year defense project at ICT University, Cameroon"
- "Faculty of Information and Communication Technology"
- "Supervised by [Supervisor Name]"

FOOTER: Same as landing page

Design: Educational, clean, scroll-based storytelling. Nature photography, forest greens and cream. Diagrams and flow charts should be visually appealing — not just text. The tech stack section should show actual recognizable logos/icons. Premium, authoritative, academic credibility.
```

---

## 💡 Tips for Fable 5

1. **Generate one prompt at a time** — Don't combine multiple pages
2. **Iterate** — If a design isn't right, tell Fable: "Keep the layout but change the color to [X]" or "Make the sidebar darker"
3. **Consistency** — After generating the first page you like, tell Fable: "Use this exact same design system (colors, fonts, sidebar, card style) for the next page: [paste next prompt]"
4. **Export** — Save each design as PNG for your report (Chapter 4 figures) and your Google Forms survey
