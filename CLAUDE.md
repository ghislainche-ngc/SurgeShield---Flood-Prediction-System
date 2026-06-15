# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

SurgeShield — an AI-powered flood prediction & analytics system built as a university final-year project. Three tiers:

- **`frontend/`** — Next.js 16 (App Router) + Clerk auth + Tailwind v4. The user-facing app.
- **`ml-api/`** — Python ML microservice: an OSEMN data-science pipeline (numbered stage folders) plus a Flask API (`app.py`) that serves predictions and real model metrics.
- **`designs/`** — **The intended look of every frontend page lives here as standalone `.html` files** (with matching `.png` renders). These are the source of truth for UI: each `designs/NN-*.html` is a complete, self-contained mockup (the desired layout, styling, and copy) that the corresponding React route is ported from, often near-verbatim. Before building or changing any page, open its design file here and match it. Current set: `01-landing`, `02-auth` / `02-auth-signup`, `03-dashboard`, `04-predict`, `05-results`, `06-map`, `07-analytics`, `08-history`, `09-admin`, `10-about`, `11-contact`.

`convex/`, `deployment/`, and `docs/` appear in `PROJECT_STRUCTURE.md` but **do not exist yet** — that document is the *planned* layout, not current reality. Verify against the filesystem before relying on it.

The repo root is **not** a git repository.

## Commands

Frontend (run from `frontend/`):
```bash
npm run dev      # dev server on :3000 (Turbopack)
npm run build    # production build — use to verify a change compiles
npm run lint     # eslint (flat config, eslint.config.mjs)
```

ML API (run from `ml-api/`, inside its venv):
```bash
python app.py                          # Flask dev server on :5000 (debug)
gunicorn app:app -b 0.0.0.0:5000       # production serving
# Pipeline (regenerates model artifacts + metrics, in order):
python 2_data_cleaning/clean.py        # raw/ -> processed/
python 4_modeling/train.py             # trains 3 models, saves best_model.joblib
python 5_interpretation/interpret.py   # writes metrics.json + analytics JSON + figures
```
There is no test suite; verify changes by running the dev server / building, and by exercising the Flask endpoints (`/health` confirms the model loaded).

## Architecture

**Data flow:** browser → Next.js (Clerk-protected) → *(planned)* Convex actions → Flask ML API (`/predict`, `/model-info`, `/analytics`, `/weather`). Convex is not wired yet (`frontend/src/lib/convex.ts` is a stub and `layout.tsx` mounts only `ClerkProvider`), so for now the frontend has no live backend connection. The Flask API loads its joblib artifacts at import time and reads all metrics from `ml-api/5_interpretation/metrics.json`.

**OSEMN pipeline:** `ml-api/` stage folders are numbered `1_data` … `5_interpretation` (Obtain, Scrub, Explore, Model, iNterpret). Each holds a notebook (the narrative), a production script (reproducible), and sometimes a report. Because folder names start with digits **they are not importable Python packages** — run the scripts directly; never `import 4_modeling.train`. `metrics.json` and the sibling `*.json` files in `5_interpretation/` are the single source of truth for every model number.

**Frontend page pattern:** Each Fable design in `designs/NN-*.html` is ported to a route under `src/app/` plus components under `src/components/<area>/`. Visual-heavy pages (landing, about, auth) carry their styling in a co-located **CSS Module** (`*.module.css`) ported nearly verbatim from the design's `<style>` block — only swapping font literals for the `next/font` CSS variables and external image URLs for files in `public/`. Currently only the public pages exist (`/`, `/about`, `/sign-in`, `/sign-up`); the protected pages (dashboard, predict, map, analytics, history, admin) have components built under `src/components/` but their routes are not yet created.

**Auth:** Clerk. Route protection lives in `frontend/src/proxy.ts` — **Next 16 renamed the `middleware` file convention to `proxy`** (same runtime). Everything is protected except the public routes listed there; `/admin` additionally requires `role: "admin"` from the session token (`user.public_metadata`). The `ClerkProvider` in `layout.tsx` applies a brand-matched `appearance`.

## Critical project rules

- **This is not the Next.js in your training data.** Per `frontend/AGENTS.md`, Next 16 has breaking changes to APIs/conventions/file structure — read `frontend/node_modules/next/dist/docs/` before writing framework code. (The `middleware`→`proxy` rename above is one example.)
- **Never hard-code model metrics in the UI.** Accuracy / F1 / ROC-AUC / confusion-matrix / feature-importance values must render from the real JSON in `ml-api/5_interpretation/`. Until a value is wired to the API, show a neutral placeholder (e.g. `Hero.tsx` uses `ACCURACY = "—"` instead of the design's "93.2%"). This matters because the dataset was found to carry no learnable signal — the project's integrity narrative depends on reporting honest numbers.
- **There are 11 input features, not 12.** Fix any "12" from the designs. (Latitude/Longitude exist only for the map, not the model.)
- **`ml-api/1_data/raw/` is immutable.** Cleaning reads `raw/` and writes `processed/`; never overwrite raw data.

## Design system (Tailwind v4, CSS-first)

Tokens live in `frontend/src/app/globals.css` (there is **no `tailwind.config.ts`** — Tailwind v4 is configured via `@theme` + PostCSS). Palette: forest `#1a3a2a`, teal `#0d9488`, cream `#faf7f2`, charcoal `#1c1c1c`; risk colors green/amber/red/dark-red. Headings use Playfair Display, body uses Inter (both via `next/font`, exposed as `--font-playfair` / `--font-inter`).

The Fable marketing design tokens (`--forest`, `--teal-bright`, `--radius-pill`, `--shadow-*`, etc., consumed by the CSS Modules) are defined under an **`html:root` selector, not a bare `:root`** — Tailwind v4 merges any bare `:root{}` into its own generated theme block and drops the custom properties it doesn't recognize, and `html:root` also out-specifies Tailwind's same-named `--radius-*` defaults. Keep that selector when editing those tokens.
