#!/bin/sh
set -e

echo "[ampera] Running prisma migrate deploy..."
npx prisma migrate deploy || echo "[ampera] migrate deploy returned non-zero, continuing"

echo "[ampera] Running seed..."
node ./scripts/seed-runner.js || echo "[ampera] seed returned non-zero, continuing"

echo "[ampera] Starting Next.js..."
exec node server.js
