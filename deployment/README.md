# Deploying SurgeShield to a Contabo VPS (Ubuntu)

This hosts **both** services on one VPS, behind Nginx with real HTTPS:

| Service | Public host | Internal |
| --- | --- | --- |
| Next.js frontend | `https://<IP>.sslip.io` | `127.0.0.1:3000` (`next start`) |
| Flask ML API | `https://api.<IP>.sslip.io` | `127.0.0.1:5000` (gunicorn) |

Convex stays managed (cloud) and Clerk stays as-is; only `ML_API_URL` changes to
point at the API host. We use **sslip.io** because you have an IP but no domain:
`<IP>.sslip.io` is a real hostname that resolves to your IP, so Let's Encrypt can
issue a certificate (a bare IP cannot get one, and Convex actions must call HTTPS).

> Replace `<IP>` everywhere with your VPS IPv4. A fresh Contabo VPS only gives
> you `root` — **Step 0 creates a non-root sudo user and every later step runs
> as that user** (not root). The app itself runs under a separate unprivileged
> `surgeshield` service account (Step 3).
> If you later buy a domain, point it at the IP and re-run the certbot step with
> the real hostnames instead of the sslip.io ones.

---

## 0. Create a non-root admin user + harden SSH (as root, once)

Don't deploy as root. Create a sudo-capable login user, give it your SSH key,
verify it works, then disable root/password logins. Do this **once**, while
still logged in as `root`.

```bash
# --- as root, on the VPS ---
adduser deploy                       # set a strong password when prompted
usermod -aG sudo deploy              # grant sudo

# Give the new user your SSH key so you can log in without a password:
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
# Reuse the key you already use for root, if any:
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys 2>/dev/null || true
# ...or paste your PUBLIC key into the file instead:
#   nano /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

Open a **new terminal** and confirm the new login works **before** locking root
out:

```bash
ssh deploy@<IP>        # from your local machine
sudo whoami            # must print: root
```

Once that works, harden SSH:

```bash
# --- as deploy, via sudo ---
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/'        /etc/ssh/sshd_config
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

> Keep `PasswordAuthentication yes` if you log in with a password rather than a
> key — but key-only is strongly recommended. From here on, **every step runs as
> `deploy`** and uses `sudo` where root is needed.

## 1. Set the hostnames (do this once per shell)

```bash
IP=203.0.113.5                       # <-- your VPS IPv4
FRONTEND_HOST=${IP}.sslip.io
API_HOST=api.${IP}.sslip.io
echo "frontend=$FRONTEND_HOST  api=$API_HOST"
```

## 2. System packages

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install git curl nginx python3-venv python3-pip ufw \
                    certbot python3-certbot-nginx
# Node.js 22 LTS (matches CI)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt -y install nodejs
node -v && npm -v
```

## 3. App user + clone

```bash
sudo useradd --system --create-home --shell /bin/bash surgeshield || true
sudo mkdir -p /opt/surgeshield && sudo chown surgeshield:surgeshield /opt/surgeshield
sudo -u surgeshield git clone \
  https://github.com/ghislainche-ngc/SurgeShield---Flood-Prediction-System.git /opt/surgeshield
```

## 4. Flask ML API (venv + slim deps)

```bash
cd /opt/surgeshield/ml-api
sudo -u surgeshield python3 -m venv venv
sudo -u surgeshield ./venv/bin/pip install --upgrade pip
sudo -u surgeshield ./venv/bin/pip install -r requirements-serve.txt
# smoke test (Ctrl-C after it prints "model_loaded"): 
sudo -u surgeshield ./venv/bin/gunicorn app:app --bind 127.0.0.1:5000 &
sleep 3 && curl -s localhost:5000/health && kill %1
```

## 5. Frontend env + build

Create `/opt/surgeshield/frontend/.env.local` with the **same values you use
locally** (copy from your machine's `frontend/.env.local`). Required keys:

```ini
NEXT_PUBLIC_CONVEX_URL=https://shocking-zebra-166.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

```bash
sudo chown surgeshield:surgeshield /opt/surgeshield/frontend/.env.local
sudo chmod 600 /opt/surgeshield/frontend/.env.local
cd /opt/surgeshield/frontend
sudo -u surgeshield npm ci
sudo -u surgeshield npm run build      # needs the env above + internet (fonts)
```

## 6. systemd services

```bash
sudo cp /opt/surgeshield/deployment/surgeshield-api.service /etc/systemd/system/
sudo cp /opt/surgeshield/deployment/surgeshield-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now surgeshield-api surgeshield-web
# verify both are listening
curl -s localhost:5000/health && curl -sI localhost:3000 | head -1
sudo systemctl --no-pager status surgeshield-api surgeshield-web | head -20
```

## 7. Nginx reverse proxy

```bash
sudo cp /opt/surgeshield/deployment/nginx-surgeshield.conf /etc/nginx/sites-available/surgeshield.conf
sudo sed -i "s/__FRONTEND_HOST__/$FRONTEND_HOST/; s/__API_HOST__/$API_HOST/" \
  /etc/nginx/sites-available/surgeshield.conf
sudo ln -sf /etc/nginx/sites-available/surgeshield.conf /etc/nginx/sites-enabled/surgeshield.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 8. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```
> Contabo also has an optional **Cloud Firewall** in its web panel — if enabled
> there, allow inbound 22/80/443 as well.

## 9. HTTPS (Let's Encrypt via sslip.io)

```bash
sudo certbot --nginx -d "$FRONTEND_HOST" -d "$API_HOST" \
  --non-interactive --agree-tos -m you@example.com --redirect
# certbot edits the nginx config to add 443 + HTTP→HTTPS redirect, and installs
# a renewal timer. Verify:
curl -s "https://$API_HOST/health"
```

## 10. Point Convex at the API

From your **local machine** (or the VPS) in `frontend/`:

```bash
npx convex env set ML_API_URL "https://api.<IP>.sslip.io"
```
This replaces the throwaway tunnel. Predict / weather / analytics now hit the VPS.

## 11. Clerk (allow the new origin)

In the Clerk Dashboard, add `https://<IP>.sslip.io` to the instance's allowed
origins / paths. The current keys are a **development** instance, which is fine
for a demo. For a polished production deploy, create a **production** instance
(`pk_live`/`sk_live`), set its domain, redo the Convex JWT template, and swap the
keys in `.env.local` + the Convex `auth.config.ts` issuer.

## 12. Verify end-to-end

- `https://<IP>.sslip.io` loads the app (padlock = valid cert).
- Sign in → **Predict** → Analyze: a real prediction saves and the dashboard,
  history, map, admin, and `/analytics` all populate from the VPS API.

## Redeploys

**Manual** — SSH in and run:

```bash
bash /opt/surgeshield/deployment/deploy.sh
```

This pulls `main`, reinstalls deps, rebuilds the frontend, and restarts both
services.

## Continuous deployment (GitHub Actions → VPS)

`.github/workflows/deploy.yml` runs `deploy.sh` over SSH **after** the CI
workflow (`ci.yml`) succeeds on `main` — it's triggered by `workflow_run`, so a
cancelled/superseded CI run never interrupts a deploy. So once this is set up,
the loop is just: `git push` → CI passes → VPS redeploys.

CI logs in as the **`surgeshield`** service account (it owns `/opt/surgeshield`,
so `git pull`/`npm` run natively and `deploy.sh` works verbatim). Two one-time
setups are needed — one on the VPS, one in GitHub.

### A. On the VPS (once)

1. **Generate a dedicated deploy keypair** (do this on your laptop, *not* the
   VPS — the private half goes into GitHub, the public half onto the VPS):

   ```bash
   ssh-keygen -t ed25519 -f surgeshield_deploy -N "" -C "github-actions-deploy"
   # creates surgeshield_deploy (private) + surgeshield_deploy.pub (public)
   ```

2. **Authorize the public key for `surgeshield`** (run as your `deploy` admin
   user, via sudo):

   ```bash
   sudo install -d -m 700 -o surgeshield -g surgeshield /home/surgeshield/.ssh
   # paste the contents of surgeshield_deploy.pub as a new line:
   echo 'ssh-ed25519 AAAA... github-actions-deploy' \
     | sudo tee -a /home/surgeshield/.ssh/authorized_keys
   sudo chown surgeshield:surgeshield /home/surgeshield/.ssh/authorized_keys
   sudo chmod 600 /home/surgeshield/.ssh/authorized_keys
   ```

3. **Let `surgeshield` restart only its two services without a password** — a
   scoped `NOPASSWD` rule (it stays unprivileged for everything else):

   ```bash
   echo 'surgeshield ALL=(root) NOPASSWD: /usr/bin/systemctl restart surgeshield-api surgeshield-web' \
     | sudo tee /etc/sudoers.d/surgeshield-deploy
   sudo chmod 440 /etc/sudoers.d/surgeshield-deploy
   sudo visudo -c     # syntax check — must say "parsed OK"
   ```

   > The rule must match the exact command in `deploy.sh`
   > (`systemctl restart surgeshield-api surgeshield-web`, both units in one
   > call). Verify `systemctl`'s path with `command -v systemctl` and adjust if
   > it's not `/usr/bin/systemctl`.

   Then confirm the key + sudo work non-interactively, from your laptop:

   ```bash
   ssh -i surgeshield_deploy surgeshield@<IP> \
     'sudo systemctl restart surgeshield-api surgeshield-web && echo OK'
   ```

### B. In GitHub (once)

Add repository secrets (**Settings → Secrets and variables → Actions**, or scope
them to a `production` Environment — the workflow declares `environment: production`):

| Secret | Value |
| --- | --- |
| `VPS_HOST` | the VPS IPv4 (e.g. `185.245.183.96`) |
| `VPS_USER` | `surgeshield` |
| `VPS_SSH_KEY` | the **full private key** — paste the entire `surgeshield_deploy` file, including the `-----BEGIN/END-----` lines |
| `VPS_PORT` | *(optional)* SSH port if not `22` |

Push any commit to `main` and watch the **Deploy to VPS** job in the Actions tab.
If a deploy fails, the services keep running the previous build (the restart is
the last step), so a bad deploy won't take the site down — `deploy.sh` uses
`set -euo pipefail` and stops before restarting if the build fails.

> **Security notes.** The key only grants the `surgeshield` login + the two
> scoped restarts. Step 0's SSH hardening (key-only auth) still applies. The
> workflow pins the host key via `ssh-keyscan` on first run (TOFU); for a
> stronger guarantee, capture `ssh-keyscan <IP>` output once and store it as a
> `VPS_KNOWN_HOSTS` secret. Rotate the deploy key by regenerating it and
> updating `authorized_keys` + the `VPS_SSH_KEY` secret.

## Notes / security

- The Flask API is reachable publicly and has no auth of its own — the app's
  gatekeeping is in Convex/Clerk. For a hardening pass you could require a shared
  secret header (set it in the Convex action + check it in Flask) or restrict the
  API host to Convex's egress. Fine to skip for the defense demo.
- Logs: `journalctl -u surgeshield-api -f` and `journalctl -u surgeshield-web -f`.
- Cert auto-renews via the certbot systemd timer (`systemctl list-timers | grep certbot`).
