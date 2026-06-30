#!/usr/bin/env bash
# Sync local environment variables to GitHub Secrets.
#
# Usage:
#   1. Create infrastructure/scripts/.env with your secrets:
#      VITE_API_BASE_PRODUCTION=https://control.boxty.dev
#      AWS_ACCESS_KEY_ID=AKIA...
#      AWS_SECRET_ACCESS_KEY=...
#      ...
#
#   2. Run:
#      ./infrastructure/scripts/sync-secrets.sh
#
#   3. Optional: specify environment file:
#      ./infrastructure/scripts/sync-secrets.sh /path/to/.env
#
# Requires: gh CLI authenticated with repo scope.

set -euo pipefail

ENV_FILE="${1:-$(dirname "$0")/.env}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI is not installed. Install from https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh CLI is not authenticated. Run: gh auth login"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: env file not found: $ENV_FILE"
  echo "Create it first. See sync-secrets.example.env for the template."
  exit 1
fi

REMOTE_REPO=$(gh repo view --json url --jq '.url' 2>/dev/null || true)
if [[ -z "$REMOTE_REPO" ]]; then
  echo "Error: could not determine GitHub repository. Run from inside the repo."
  exit 1
fi

echo "Syncing secrets from $ENV_FILE to $REMOTE_REPO ..."

while IFS='=' read -r key value || [[ -n "$key" ]]; do
  # Skip comments and empty lines
  [[ "$key" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${key// }" ]] && continue

  # Trim whitespace
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)

  # Skip if value is empty or placeholder
  if [[ -z "$value" ]] || [[ "$value" == "***" ]] || [[ "$value" == "YOUR_*"* ]]; then
    echo "  SKIP $key (empty or placeholder)"
    continue
  fi

  echo "  SET $key"
  gh secret set "$key" --body "$value" >/dev/null
done < "$ENV_FILE"

echo "Done."
