# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

SurgeShield — an AI-powered flood prediction & analytics system built as a university final-year project. Three tiers:

- **`frontend/`** — Next.js 16 (App Router) + Clerk auth + Tailwind v4. The user-facing app.
- **`ml-api/`** — Python ML microservice: an OSEMN data-science pipeline (numbered stage folders) plus a Flask API (`app.py`) that serves predictions and real model metrics.
- **`designs/`** — **The intended look of every frontend page lives here as standalone `.html` files** (with matching `.png` renders). These are the source of truth for UI: each `designs/NN-*.html` is a complete, self-contained mockup (the desired layout, styling, and copy) that the corresponding React route is ported from, often near-verbatim. Before building or changing any page, open its design file here and match it. Current set: `01-landing`, `02-auth` / `02-auth-signup`, `03-dashboard`, `04-predict`, `05-results`, `06-map`, `07-analytics`, `08-history`, `09-admin`, `10-about`, `11-contact`.

`deployment/` now exists — it holds the **Contabo VPS** runbook (`README.md`) + config (gunicorn `surgeshield-api.service`, `next start` `surgeshield-web.service`, `nginx-surgeshield.conf`, `deploy.sh`): both services on one Ubuntu VPS behind Nginx, HTTPS via Let's Encrypt over **sslip.io** (IP-only, no domain), with `ML_API_URL` → `https://api.<ip>.sslip.io`. `docs/` still **does not exist yet** — `PROJECT_STRUCTURE.md` is the *planned* layout, not current reality. Verify against the filesystem before relying on it. Note: Convex lives in **`frontend/convex/`** (not the repo root as PROJECT_STRUCTURE.md sketches), so the CLI, codegen, and the app's `convex/_generated` imports stay colocated with the package that depends on `convex`.

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

**Data flow:** browser → Next.js (Clerk-protected) → Convex (queries/mutations/actions) → Flask ML API (`/predict`, `/model-info`, `/analytics`, `/weather`). Convex is wired: `frontend/convex/` holds `schema.ts`, `auth.config.ts` (Clerk issuer + `applicationID: "convex"`), CRUD functions (`predictions.ts`, `locations.ts`, `admin.ts`), and the Flask-calling **actions** (`actions.ts`: `predict`, `weather`, which read `process.env.ML_API_URL` and map our camelCase schema keys → the pipeline's tidy column names). `ConvexProviderWithClerk` is mounted in `layout.tsx` via `src/components/providers/ConvexClientProvider.tsx`, forwarding the Clerk token so `ctx.auth.getUserIdentity()` resolves. The dashboard and history already read **live** Convex queries. **Reachability:** Convex actions run in Convex's cloud, so `ML_API_URL` must be a publicly reachable Flask URL — in dev, tunnel `localhost:5000` (e.g. Cloudflare quick tunnel) and `npx convex env set ML_API_URL <url>`. The Flask API loads its joblib artifacts at import time and reads all metrics from `ml-api/5_interpretation/metrics.json`.

**OSEMN pipeline:** `ml-api/` stage folders are numbered `1_data` … `5_interpretation` (Obtain, Scrub, Explore, Model, iNterpret). Each holds a notebook (the narrative), a production script (reproducible), and sometimes a report. Because folder names start with digits **they are not importable Python packages** — run the scripts directly; never `import 4_modeling.train`. `metrics.json` and the sibling `*.json` files in `5_interpretation/` are the single source of truth for every model number.

**Frontend page pattern:** Each Fable design in `designs/NN-*.html` is ported to a route under `src/app/` plus components under `src/components/<area>/`. Styling is a co-located **CSS Module** (`*.module.css`) ported nearly verbatim from the design's `<style>` block — only swapping font literals for the `next/font` CSS variables and external image URLs for files in `public/`. When a design's `:root` tokens differ from the globals (e.g. the dashboard's `--radius-lg`/risk palette), scope the overrides to a wrapper class (the app shell does this on `.app` in `appShell.module.css`).

Protected pages live under the **`(app)` route group**: `src/app/(app)/layout.tsx` renders the shared shell (`Sidebar` + `TopBar` from `components/layout/`, styled by `appShell.module.css`). The dashboard uses `<TopBar title=…>`; other pages (e.g. history) render their own page-specific header per their design. **Existing routes:** public — `/`, `/about`, `/contact`, `/sign-in`, `/sign-up`; protected — `/dashboard`, `/predict`, `/map`, `/history`, `/analytics`, `/admin` (admin-only). **All design pages are now built.** `/analytics` renders real metrics from the ML API via the `getAnalytics` Convex action (Flask `/analytics`) — honest chance-level numbers, hand-rolled SVG charts. The map (`/map`) is **MapLibre GL** (`maplibre-gl` dep, client-only `dynamic ssr:false`), keyless CARTO dark basemap, plotting live Convex predictions + saved locations — built directly rather than via the `npx mapcn` CLI (which is Tailwind/shadcn-flavored and fights the CSS-Modules setup). Contact's form persists to Convex (`contactMessages`); Admin reads live Convex data with honest `—` placeholders for ML-API metrics.

**Auth:** Clerk. Route protection lives in `frontend/src/proxy.ts` — **Next 16 renamed the `middleware` file convention to `proxy`** (same runtime). Everything is protected except the public routes listed there; `/admin` additionally requires `role: "admin"` from the session token (`user.public_metadata`). The auth pages are **custom headless forms** (`components/auth/`), not the prebuilt `<SignIn>/<SignUp>` widgets, built on this Clerk version's **signals/Future API** (`useSignIn`/`useSignUp` → `signIn.password()` / `signUp.verifications` / `sso()` / `finalize()`, returning `{ error }` not throwing). After `finalize()`, navigate with a hard `window.location.assign(...)`, never `router.push` — a soft nav races the session-cookie sync and bounces the user back to sign-in.

## Critical project rules

- **This is not the Next.js in your training data.** Per `frontend/AGENTS.md`, Next 16 has breaking changes to APIs/conventions/file structure — read `frontend/node_modules/next/dist/docs/` before writing framework code. (The `middleware`→`proxy` rename above is one example.)
- **Never hard-code model metrics in the UI.** Accuracy / F1 / ROC-AUC / confusion-matrix / feature-importance values must render from the real JSON in `ml-api/5_interpretation/`. Until a value is wired to the API, show a neutral placeholder (e.g. `Hero.tsx` uses `ACCURACY = "—"` instead of the design's "93.2%"). This matters because the dataset was found to carry no learnable signal — the project's integrity narrative depends on reporting honest numbers.
- **There are 11 input features, not 12.** Fix any "12" from the designs. (Latitude/Longitude exist only for the map, not the model.)
- **Maps use mapcn (MapLibre GL), not Leaflet.** Decided 2026-06-15 — keyless CARTO basemaps + WebGL handles the ~10k observations better. This supersedes PROJECT_STRUCTURE.md's "react-leaflet" note and the Leaflet `<script>` in `designs/06-map.html`. Render maps in client-only (no-SSR) components.
- **`ml-api/1_data/raw/` is immutable.** Cleaning reads `raw/` and writes `processed/`; never overwrite raw data.

## Design system (Tailwind v4, CSS-first)

Tokens live in `frontend/src/app/globals.css` (there is **no `tailwind.config.ts`** — Tailwind v4 is configured via `@theme` + PostCSS). Palette: forest `#1a3a2a`, teal `#0d9488`, cream `#faf7f2`, charcoal `#1c1c1c`; risk colors green/amber/red/dark-red. Headings use Playfair Display, body uses Inter (both via `next/font`, exposed as `--font-playfair` / `--font-inter`).

The Fable marketing design tokens (`--forest`, `--teal-bright`, `--radius-pill`, `--shadow-*`, etc., consumed by the CSS Modules) are defined under an **`html:root` selector, not a bare `:root`** — Tailwind v4 merges any bare `:root{}` into its own generated theme block and drops the custom properties it doesn't recognize, and `html:root` also out-specifies Tailwind's same-named `--radius-*` defaults. Keep that selector when editing those tokens.
