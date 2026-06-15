#!/usr/bin/env bash
#
# Redeploy SurgeShield on the VPS after pushing changes to GitHub.
# Run as the `surgeshield` user (or with sudo for the restart):
#   bash /opt/surgeshield/deployment/deploy.sh
#
set -euo pipefail

ROOT=/opt/surgeshield
cd "$ROOT"

echo "==> Pulling latest"
git pull --ff-only

echo "==> Updating API deps"
"$ROOT/ml-api/venv/bin/pip" install -q -r "$ROOT/ml-api/requirements-serve.txt"

echo "==> Building frontend"
cd "$ROOT/frontend"
npm ci
npm run build

echo "==> Restarting services"
sudo systemctl restart surgeshield-api surgeshield-web

echo "==> Status"
systemctl --no-pager --lines=0 status surgeshield-api surgeshield-web || true
echo "Done."
