#!/usr/bin/env bash
# Simple smoke checks for Supabase functions. Set PROJECT_REF before running.
# Example:
# PROJECT_REF=isnezquuwepqcjkaupjh ./scripts/smoke-checks.sh

set -euo pipefail
PROJECT_REF=${PROJECT_REF:-}
if [ -z "$PROJECT_REF" ]; then
  echo "Set PROJECT_REF environment variable to your supabase project ref"
  exit 1
fi
BASE=https://$PROJECT_REF.functions.supabase.co

echo "Checking /health"
curl -s "$BASE/health" | jq || true

echo "Checking validate_quote (min 4h enforcement)"
curl -s -H "Content-Type: application/json" -d '{"hours":3,"hourly":400,"vehicle":0,"armed":false}' "$BASE/validate_quote" | jq || true

echo "Done"
