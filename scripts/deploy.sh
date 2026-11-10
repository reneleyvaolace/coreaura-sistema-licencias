#!/usr/bin/env bash
# Despliega el sistema de licencias en el servidor administrativo.
# Uso: ./scripts/deploy.sh
#   git pull -> npm ci -> build -> PM2 restart licencias (:3000)
# Corre en segundo plano: nohup ./scripts/deploy.sh > deploy.log 2>&1 &
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> git pull"
git pull --ff-only

echo "==> npm ci"
npm ci

echo "==> build"
NODE_OPTIONS=--max-old-space-size=2048 npm run build

echo "==> pm2 restart licencias"
if pm2 describe "licencias" >/dev/null 2>&1; then
  pm2 restart "licencias"
else
  pm2 start npm --name "licencias" -- start
fi

echo "==> listo: licencias en puerto 3000"
