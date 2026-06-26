# SurgeShield Redeploy (Vercel + Render) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring SurgeShield back online without the dead VPS — Next.js frontend on Vercel, Flask ML API on Render, on the retained `surgeshield.online` domain (Namecheap DNS).

**Architecture:** Two managed platforms replace the single VPS. Render runs the Flask API (gunicorn, free Python service) at `api.surgeshield.online`; Vercel runs the Next.js frontend at `surgeshield.online`. Convex (dev deployment) and Clerk (dev keys) are unchanged — only Convex's `ML_API_URL` env var and Clerk's allowed-origins list are re-pointed.

**Tech Stack:** Next.js 16, Flask + gunicorn, Render, Vercel, Convex, Clerk, Namecheap DNS.

> **Note on this plan's "tests":** there is no automated test suite (per CLAUDE.md). The verification step in each task is a concrete command (`curl`, a URL load, or a UI action) with expected output. Treat a failing verification exactly like a failing test: stop and fix before moving on.

> **Secrets:** This plan never writes secret values into files. Where env vars are needed, copy the values from your local `frontend/.env.local` (gitignored). Do **not** paste secrets into committed files.

---

## Task 1: Add Render Blueprint for the Flask API

**Files:**
- Create: `ml-api/render.yaml`

- [ ] **Step 1: Create the Render Blueprint**

Create `ml-api/render.yaml` with exactly this content:

```yaml
# Render Blueprint for the SurgeShield Flask ML API.
# Free Python web service running gunicorn. Render injects $PORT.
# PYTHON_VERSION pins the interpreter so the artifacts' pinned
# scikit-learn==1.5.2 wheel installs cleanly (matches CI: Python 3.12).
services:
  - type: web
    name: surgeshield-api
    runtime: python
    rootDir: ml-api
    plan: free
    buildCommand: pip install -r requirements-serve.txt
    startCommand: gunicorn app:app --bind 0.0.0.0:$PORT
    healthCheckPath: /health
    autoDeploy: true
    envVars:
      - key: PYTHON_VERSION
        value: 3.12.7
```

- [ ] **Step 2: Verify the YAML parses**

Run from the repo root:

```bash
python -c "import yaml; print(yaml.safe_load(open('ml-api/render.yaml'))['services'][0]['name'])"
```

Expected output: `surgeshield-api`

(If `yaml` isn't installed: `python -c "import json,sys; print(open('ml-api/render.yaml').read())"` and eyeball that it matches the block above.)

- [ ] **Step 3: Commit**

```bash
git add ml-api/render.yaml
git commit -m "Add Render Blueprint for the Flask ML API"
```

---

## Task 2: Remove the dead VPS deploy workflow

**Files:**
- Delete: `.github/workflows/deploy.yml`

**Why:** `deploy.yml` fires on every successful CI run on `main` and SSHes into the now-dead VPS — it will fail on every push. CI (`ci.yml`) stays; only the deploy step goes. Vercel and Render each auto-deploy from GitHub on their own.

- [ ] **Step 1: Delete the workflow**

```bash
git rm .github/workflows/deploy.yml
```

- [ ] **Step 2: Verify it's gone and CI remains**

```bash
ls .github/workflows/
```

Expected output: `ci.yml` only (no `deploy.yml`).

- [ ] **Step 3: Commit**

```bash
git commit -m "Remove dead VPS deploy workflow (replaced by Vercel + Render)"
```

---

## Task 3: Push to GitHub so Render and Vercel can build

**Files:** none (git push)

**Why:** Render and Vercel deploy from the GitHub repo. The commits from Tasks 1–2 (and the design spec) must be on `origin/main` before importing.

- [ ] **Step 1: Push**

```bash
git push origin main
```

- [ ] **Step 2: Verify the push landed**

```bash
git log origin/main --oneline -3
```

Expected: the top three commits include "Remove dead VPS deploy workflow…" and "Add Render Blueprint…".

---

## Task 4: Deploy the Flask API on Render

**This is a Render dashboard task.** Do it at https://dashboard.render.com.

- [ ] **Step 1: Create the service from the Blueprint**

1. Render dashboard → **New +** → **Blueprint**.
2. Connect the GitHub repo (`SurgeShield---Flood-Prediction-System`) if not already connected.
3. Render detects `ml-api/render.yaml` and proposes the `surgeshield-api` web service. **Apply**.

> If Blueprint detection fails (e.g. it only scans the repo root), instead use **New + → Web Service**, pick the repo, and set manually: Root Directory `ml-api`, Runtime `Python 3`, Build `pip install -r requirements-serve.txt`, Start `gunicorn app:app --bind 0.0.0.0:$PORT`, Health Check Path `/health`, Plan `Free`, and add env var `PYTHON_VERSION=3.12.7`.

- [ ] **Step 2: Wait for the first deploy to go live**

Watch the deploy logs until status is **Live**. The build installs the slim deps and gunicorn boots `app:app`. Note the public URL Render assigns, e.g. `https://surgeshield-api.onrender.com`.

- [ ] **Step 3: Verify the API is up (the "test")**

```bash
curl -s https://surgeshield-api.onrender.com/health
```

Expected: JSON containing `"model_loaded": true` (the `/health` endpoint confirms the joblib artifacts loaded). The very first request may take ~50s if the free instance was cold — re-run once if it times out.

- [ ] **Step 4: Spot-check a real prediction path**

```bash
curl -s https://surgeshield-api.onrender.com/model-info
```

Expected: JSON with the model name/metrics (honest ~0.50 numbers). If this and `/health` both return, the API is fully serving.

---

## Task 5: Deploy the frontend on Vercel

**This is a Vercel dashboard task.** Do it at https://vercel.com/new.

- [ ] **Step 1: Import the repo**

1. Vercel → **Add New… → Project** → import `SurgeShield---Flood-Prediction-System`.
2. **Root Directory:** click **Edit** → set to `frontend`. (Framework auto-detects as **Next.js**.)
3. Leave Build/Output settings at the Next.js defaults.

- [ ] **Step 2: Add Environment Variables**

In the import screen (or Project → Settings → Environment Variables), add these for the **Production** environment. Copy the two Clerk secret values from your local `frontend/.env.local`:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | *(from `.env.local`)* |
| `CLERK_SECRET_KEY` | *(from `.env.local`)* |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/dashboard` |
| `NEXT_PUBLIC_CONVEX_URL` | `https://shocking-zebra-166.convex.cloud` |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `https://shocking-zebra-166.convex.site` |
| `NEXT_PUBLIC_SITE_URL` | `https://surgeshield.online` |

> Do **not** add `CONVEX_DEPLOYMENT` — that's only for local `npx convex dev`. The Vercel build only needs `NEXT_PUBLIC_CONVEX_URL`.

- [ ] **Step 3: Deploy**

Click **Deploy**. Wait for the build to finish (Next.js build needs network for `next/font` — Vercel has it). Note the preview URL, e.g. `https://surgeshield-xxxx.vercel.app`.

- [ ] **Step 4: Verify the site loads on the vercel.app URL (the "test")**

```bash
curl -sI https://<your-project>.vercel.app | head -1
```

Expected: `HTTP/2 200`. Then open the URL in a browser — the landing page renders. (Auth pages may warn about origin until Task 9; that's expected at this stage.)

---

## Task 6: Point `api.surgeshield.online` at Render

**Render dashboard + Namecheap.**

- [ ] **Step 1: Add the custom domain in Render**

Render → `surgeshield-api` service → **Settings → Custom Domains → Add Custom Domain** → enter `api.surgeshield.online`. Render shows a **CNAME target** (e.g. `surgeshield-api.onrender.com`). Copy it.

- [ ] **Step 2: Add the DNS record in Namecheap**

Namecheap → Domain List → `surgeshield.online` → **Manage → Advanced DNS → Add New Record**:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| CNAME Record | `api` | *(the Render target from Step 1)* | Automatic |

Save. **Delete any leftover old A record for `api`** that pointed at the VPS IP.

- [ ] **Step 3: Verify DNS resolves, then HTTPS issues**

```bash
nslookup api.surgeshield.online
```

Expected: resolves to the Render target (propagation can take minutes–hours). Once Render's dashboard shows the domain **Verified** with a cert issued:

```bash
curl -s https://api.surgeshield.online/health
```

Expected: the same `"model_loaded": true` JSON as Task 4, now on the custom domain.

---

## Task 7: Point `surgeshield.online` at Vercel

**Vercel dashboard + Namecheap.**

- [ ] **Step 1: Add the domains in Vercel**

Vercel → Project → **Settings → Domains** → add `surgeshield.online`. Add `www.surgeshield.online` too and set it to **Redirect to `surgeshield.online` (308)**. Vercel displays the exact DNS records to create.

- [ ] **Step 2: Add the DNS records in Namecheap**

In **Advanced DNS**, create the records Vercel showed. Typically:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| A Record | `@` | `76.76.21.21` | Automatic |
| CNAME Record | `www` | `cname.vercel-dns.com.` | Automatic |

> Use whatever Vercel's panel actually displays — it occasionally differs. **Remove the old VPS A records for `@` and `www`** so they don't conflict. Note: Namecheap's default "URL Redirect"/parking records on `@`/`www` must be deleted too.

- [ ] **Step 3: Verify**

```bash
nslookup surgeshield.online
```

Expected: resolves to the Vercel A record. Once Vercel shows both domains **Valid Configuration** with certs:

```bash
curl -sI https://surgeshield.online | head -1
curl -sI https://www.surgeshield.online | head -1
```

Expected: apex returns `HTTP/2 200`; `www` returns `HTTP/2 308` (redirect to apex).

---

## Task 8: Re-point Convex at the new API

**Files:** none (Convex CLI from `frontend/`)

**Why:** Convex actions (`predict`, `weather`, `getAnalytics`) read `ML_API_URL`. It still points at the dead VPS; switch it to the Render custom domain.

- [ ] **Step 1: Set the env var**

```bash
cd frontend
npx convex env set ML_API_URL https://api.surgeshield.online
```

- [ ] **Step 2: Verify it took**

```bash
npx convex env get ML_API_URL
```

Expected output: `https://api.surgeshield.online`

---

## Task 9: Allow the new origin in Clerk

**Clerk dashboard task** at https://dashboard.clerk.com (the **development** instance matching the `pk_test` key in `.env.local`).

- [ ] **Step 1: Add the production domain**

Clerk → your instance → **Domains** (and/or **Paths / Allowed origins**) → add `https://surgeshield.online` and `https://www.surgeshield.online`.

- [ ] **Step 2: Verify sign-in works on the live domain**

Open `https://surgeshield.online/sign-in` in a fresh browser session and sign in. Expected: auth completes and lands on `/dashboard` (no "origin not allowed" error in the console).

> Optional (later): for a polished production setup, create a Clerk **production** instance (`pk_live`/`sk_live`), set its domain, redo the Convex JWT template (so admin `public_metadata` is included), and swap the keys in Vercel env + `frontend/convex/auth.config.ts`. Out of scope for this redeploy.

---

## Task 10: End-to-end verification

**Files:** none (manual smoke test)

- [ ] **Step 1: Machine-readable checks**

```bash
curl -s https://api.surgeshield.online/health
curl -sI https://surgeshield.online | head -1
curl -s https://surgeshield.online/robots.txt
curl -s https://surgeshield.online/sitemap.xml | head -5
```

Expected: API health JSON; apex `HTTP/2 200`; `robots.txt` referencing `surgeshield.online`; a valid sitemap XML opening tag.

- [ ] **Step 2: Full user flow in the browser**

1. Go to `https://surgeshield.online`, sign in.
2. **Predict** → fill the 11 input features → **Analyze**.
3. Confirm a prediction is returned and **saved** (no error — this proves Vercel → Convex → Render all connect).
4. Visit **Dashboard**, **History**, **Map**, **/analytics**, **/admin** — each populates from live data / the Render API.

Expected: every page loads with real data; the prediction round-trips end to end.

- [ ] **Step 3: Confirm CI is green and no deploy workflow runs**

Check GitHub → Actions: the **CI** workflow runs on the push from Task 3 and passes; there is **no** failing **Deploy** workflow (deleted in Task 2).

---

## Self-review notes

- **Spec coverage:** Render API (Tasks 1,4,6), Vercel frontend (Tasks 5,7), DNS at Namecheap (Tasks 6,7), Convex `ML_API_URL` (Task 8), Clerk origin (Task 9), cleanup of VPS workflow (Task 2), verification (Task 10). All spec sections mapped.
- **No code changes** to the app, as the spec requires — only `render.yaml` (new infra file) and deletion of `deploy.yml`.
- **Optional `render.yaml`** from the spec is included as the primary path (Task 1) with a manual-setup fallback (Task 4 Step 1 note).
- The `.xyz` domain remains unused; `surgeshield.online` is canonical throughout, consistent with the spec.
