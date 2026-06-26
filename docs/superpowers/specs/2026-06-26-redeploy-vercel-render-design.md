# Redeploy SurgeShield — Vercel (frontend) + Render (Flask API)

**Date:** 2026-06-26
**Status:** Approved design, pending implementation plan

## Context

SurgeShield was previously deployed on a single Contabo VPS (both the Next.js
frontend and the Flask ML API behind Nginx, HTTPS via Let's Encrypt) on the
domain `surgeshield.online`. The VPS has had an issue and is being abandoned.

This spec redeploys the system without a VPS, using managed platforms:

- **Vercel** for the Next.js frontend (free, always-warm, purpose-built for Next).
- **Render** for the Flask ML API (free Python web service, native gunicorn).

The domain `surgeshield.online` (registered at Namecheap) is retained — a domain
is independent of hosting, so its DNS is simply re-pointed. (A newer `.xyz`
domain the user also owns is **not** used here; `.online` stays canonical.)

Convex and Clerk are already cloud-hosted and do **not** move.

## Goals

- Frontend live at `https://surgeshield.online` (Vercel), `www` → 301 → apex.
- Flask ML API live at `https://api.surgeshield.online` (Render).
- Predict / weather / analytics work end-to-end again (Convex actions reach the
  new API URL).
- No application code changes required (verified: `SITE_URL` already defaults to
  `surgeshield.online`; API reads config the same way; model artifacts committed;
  `requirements-serve.txt` already has gunicorn + pinned `scikit-learn==1.5.2`).

## Non-goals (YAGNI)

- Migrating Convex from its existing **dev** deployment (`shocking-zebra-166`) to
  a production deployment. Keeping it preserves existing data/admin users.
- Upgrading Clerk from dev keys (`pk_test`/`sk_test`) to a production instance.
  Dev keys work for the demo; production is an optional later step (new keys +
  redo Convex JWT template).
- Adding a shared-secret header between Convex and the Flask API.

## Architecture

```
surgeshield.online       → Vercel       → Next.js frontend (root dir: frontend/)
www.surgeshield.online   → 301 → apex
api.surgeshield.online   → Render       → Flask ML API (root dir: ml-api/, gunicorn)
                           Convex cloud → DB + actions (dev deployment, unchanged)
                           Clerk cloud  → auth (dev keys, unchanged)
```

Data flow is unchanged from the VPS deploy: browser → Vercel (Clerk-protected) →
Convex actions → Flask ML API. The only rewiring is the public URL of the Flask
API.

## Components

### 1. Flask ML API on Render

- New **Python web service**, deployed from the GitHub repo.
- **Root directory:** `ml-api`
- **Build command:** `pip install -r requirements-serve.txt`
- **Start command:** `gunicorn app:app --bind 0.0.0.0:$PORT`
  - Render injects `$PORT`; `app.py`'s hardcoded `port=5000` only applies to the
    `__main__` dev path and is bypassed by gunicorn. No code change.
- **Python version:** pin to `3.12` (via `runtime.txt` `python-3.12.x` or a
  `PYTHON_VERSION` env var) so the pinned `scikit-learn==1.5.2` wheel installs
  cleanly.
- **Custom domain:** `api.surgeshield.online` (Render auto-issues HTTPS).
- **Free-tier caveat:** the service spins down after ~15 min idle → ~50s cold
  start on the next request. Acceptable for the API.
- *(Optional)* commit a `render.yaml` so the service config is reproducible and
  version-controlled rather than dashboard-only.

### 2. Next.js frontend on Vercel

- Import the GitHub repo into a Vercel project.
- **Root directory:** `frontend` (framework auto-detected as Next.js).
- **Environment variables** (from `frontend/.env.local`):
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard`
  - `NEXT_PUBLIC_CONVEX_URL=https://shocking-zebra-166.convex.cloud`
  - `NEXT_PUBLIC_CONVEX_SITE_URL=https://shocking-zebra-166.convex.site`
  - `NEXT_PUBLIC_SITE_URL=https://surgeshield.online`
  - (Do **not** set `CONVEX_DEPLOYMENT` on Vercel — it's only for local
    `npx convex dev`. The build just needs `NEXT_PUBLIC_CONVEX_URL`.)
- **Custom domains:** `surgeshield.online` (apex, canonical) + `www` → 301 → apex.

### 3. DNS at Namecheap

- Apex `@` + `www` → Vercel (use the exact A/CNAME records Vercel's domain panel
  displays; Namecheap apex typically takes an A record + a `www` CNAME).
- `api` → CNAME to the Render service host (Render's custom-domain panel shows the
  target, e.g. `surgeshield-api.onrender.com`).

### 4. Reconnect cloud services

- From `frontend/`: `npx convex env set ML_API_URL https://api.surgeshield.online`
  — points Convex actions at the new API.
- Clerk dashboard → add `https://surgeshield.online` (and `www`) to allowed
  origins.

### 5. Cleanup

- Disable/remove `.github/workflows/deploy.yml` (targets the dead VPS; would fail
  on every push). Vercel + Render auto-deploy on push to `main` independently.
- The `deployment/` VPS runbook is now historical — leave it or annotate it as
  superseded. (Out of scope to delete in this pass.)

## Verification

- `https://api.surgeshield.online/health` returns model-loaded JSON.
- `https://surgeshield.online` loads with a valid cert; `www` redirects to apex.
- Sign in → **Predict** → Analyze: a prediction saves, and dashboard, history,
  map, admin, and `/analytics` all populate from the Render API.
- `curl https://surgeshield.online/robots.txt` and `/sitemap.xml` resolve (SEO
  intact on the retained domain).

## Order of operations

1. Deploy the Flask API on Render, confirm `/health` on the `onrender.com` URL.
2. Deploy the frontend on Vercel (still resolves on `*.vercel.app`).
3. Add custom domains on both platforms; create the Namecheap DNS records.
4. `npx convex env set ML_API_URL` → Render API URL.
5. Whitelist the origin in Clerk.
6. Run end-to-end verification.
7. Disable the old VPS deploy workflow.
