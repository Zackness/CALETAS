#!/bin/bash
set -e

echo "=== Vercel Build: Prisma db push ==="
# Try db push; if it fails due to conflicting types, drop them and retry
if ! npx prisma db push --accept-data-loss 2>&1; then
  echo "db push failed, likely conflicting type. Cleaning up..."
  npx prisma db execute --stdin <<< "DROP TYPE IF EXISTS \"BlogCategory\" CASCADE;" 2>/dev/null || true
  echo "Retrying db push..."
  npx prisma db push --accept-data-loss
fi

echo "=== Prisma generate ==="
npx prisma generate

echo "=== Next.js build ==="
NEXT_PRIVATE_WORKER_THREADS=false NODE_OPTIONS=--dns-result-order=ipv4first npx next build
