#!/usr/bin/env bash
set -euo pipefail

INFISICAL_ENV="${INFISICAL_ENV:-dev}"
INFISICAL_PROJECT_ID="${INFISICAL_PROJECT_ID:?INFISICAL_PROJECT_ID is required}"
INFISICAL_SITE_URL="${INFISICAL_SITE_URL:-https://app.infisical.com}"

command -v infisical >/dev/null || { echo "ERROR: infisical CLI is required" >&2; exit 1; }

required=(POSTGRES_PASSWORD AUTH_SECRET SESSION_SECRET RESEND_API_KEY)
for key in "${required[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "ERROR: export $key before seeding Infisical" >&2
    exit 1
  fi
done

umask 077
secrets_file=$(mktemp)
trap 'rm -f "$secrets_file"' EXIT
for key in "${required[@]}"; do
  printf '%s=%s\n' "$key" "${!key}" >> "$secrets_file"
done

infisical secrets set --file "$secrets_file" \
  --projectId "$INFISICAL_PROJECT_ID" \
  --env "$INFISICAL_ENV" \
  --domain "$INFISICAL_SITE_URL" >/dev/null

echo "Seeded ${#required[@]} Briefs secrets in Infisical environment '$INFISICAL_ENV'."
