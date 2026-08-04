#!/usr/bin/env bash
# bootstrap-secrets.sh — Seeds required secret keys into Infisical for dev and prod.
#
# Run once after `infisical init` on a fresh clone.
#
# Usage:
#   ./scripts/bootstrap-secrets.sh          # seeds both dev and prod
#   ./scripts/bootstrap-secrets.sh dev      # seeds dev only
#   ./scripts/bootstrap-secrets.sh prod     # seeds prod only
#
# Prerequisites:
#   - infisical login
#   - infisical init (creates .infisical.json in project root)

set -euo pipefail

ENV="${1:-all}"

seed_dev() {
  echo "▶ Seeding dev secrets…"
  infisical secrets set \
    --env=dev \
    BRIEF_DATABASE_URL="postgresql://brief:brief@localhost:5432/brief" \
    BRIEF_REDIS_URL="redis://localhost:6379" \
    BRIEF_AUTH_ADMIN_SECRET="dev-admin-secret-change-me" \
    BRIEF_MCP_STATIC_TOKENS="demo-user:brief_dev_token_demo"

  echo "✓ Dev secrets seeded"
}

seed_prod() {
  echo "▶ Seeding prod secrets…"
  infisical secrets set \
    --env=prod \
    POSTGRES_PASSWORD="REPLACE_ME_strong_random_password" \
    BRIEF_AUTH_ADMIN_SECRET="REPLACE_ME_run_openssl_rand_hex_32" \
    BRIEF_MCP_STATIC_TOKENS=""

  echo "✓ Prod secrets seeded"
}

case "$ENV" in
  dev)  seed_dev ;;
  prod) seed_prod ;;
  all)  seed_dev && seed_prod ;;
  *)
    echo "Usage: $0 [dev|prod|all]" >&2
    exit 1
    ;;
esac

echo ""
echo "Next steps:"
echo "  1. Open https://app.infisical.com and replace all REPLACE_ME values"
echo "  2. For BRIEF_AUTH_ADMIN_SECRET (prod): openssl rand -hex 32"
echo "  3. Run: npm run docker:secrets"
