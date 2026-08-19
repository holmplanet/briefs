#!/usr/bin/env bash
set -euo pipefail

INFISICAL_ENV="${INFISICAL_ENV:-prod}"
DROPLET_IP="${DROPLET_IP:?DROPLET_IP is required}"
SSH_KNOWN_HOSTS_FILE="${SSH_KNOWN_HOSTS_FILE:?SSH_KNOWN_HOSTS_FILE is required}"
INFISICAL_PROJECT_ID="${INFISICAL_PROJECT_ID:?INFISICAL_PROJECT_ID is required}"
INFISICAL_CLIENT_ID="${INFISICAL_CLIENT_ID:?INFISICAL_CLIENT_ID is required}"
INFISICAL_CLIENT_SECRET="${INFISICAL_CLIENT_SECRET:?INFISICAL_CLIENT_SECRET is required}"
INFISICAL_SITE_URL="${INFISICAL_SITE_URL:-https://app.infisical.com}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="${APP_DIR:-/opt/briefs}"

for image in SYSTEM_IMAGE MCP_IMAGE DAILY_IMAGE; do
  [[ -n "${!image:-}" ]] || { echo "ERROR: $image is required" >&2; exit 1; }
done

SSH_BASE=(ssh -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$SSH_KNOWN_HOSTS_FILE")
SCP_BASE=(scp -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$SSH_KNOWN_HOSTS_FILE")
if [[ -n "${SSH_KEY_PATH:-}" ]]; then
  SSH_BASE+=(-i "$SSH_KEY_PATH")
  SCP_BASE+=(-i "$SSH_KEY_PATH")
fi
SSH_CMD=("${SSH_BASE[@]}" "$DEPLOY_USER@$DROPLET_IP")

echo "Fetching production secrets from Infisical …"
INFISICAL_TOKEN=$(curl -sf -X POST "$INFISICAL_SITE_URL/api/v1/auth/universal-auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"clientId\":\"$INFISICAL_CLIENT_ID\",\"clientSecret\":\"$INFISICAL_CLIENT_SECRET\"}" \
  | jq -r '.accessToken')
[[ -n "$INFISICAL_TOKEN" && "$INFISICAL_TOKEN" != "null" ]] || { echo "ERROR: Infisical auth failed" >&2; exit 1; }

secret() {
  curl -sf "$INFISICAL_SITE_URL/api/v3/secrets/raw/$1?workspaceId=$INFISICAL_PROJECT_ID&environment=$INFISICAL_ENV" \
    -H "Authorization: Bearer $INFISICAL_TOKEN" | jq -r '.secret.secretValue'
}

POSTGRES_PASSWORD=$(secret POSTGRES_PASSWORD)
AUTH_SECRET=$(secret AUTH_SECRET)
SESSION_SECRET=$(secret SESSION_SECRET)
RESEND_API_KEY=$(secret RESEND_API_KEY)
DATABASE_URL="postgresql://briefs:${POSTGRES_PASSWORD}@postgres:5432/briefs"

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

cat > "$tmp_dir/.env" <<EOF
APP_ENV=production
NODE_ENV=production
RUNTIME_ENV_FILE=$APP_DIR/.env
SECRETS_DIR=$APP_DIR/secrets
APP_HOST=0.0.0.0
APP_PORT=8000
MCP_PORT=3334
DAILY_PORT=3000
APP_URL=${APP_URL:?APP_URL is required}
OAUTH_ISSUER=${OAUTH_ISSUER:?OAUTH_ISSUER is required}
OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID:-briefs-daily}
OAUTH_REDIRECT_URIS=${OAUTH_REDIRECT_URIS:?OAUTH_REDIRECT_URIS is required}
OTP_MAILER=resend
EMAIL_FROM=${EMAIL_FROM:?EMAIL_FROM is required}
MCP_DEV_SKIP_AUTH=false
API_DEV_BYPASS=false
AUTH_DEV_BYPASS=false
SYSTEM_IMAGE=$SYSTEM_IMAGE
MCP_IMAGE=$MCP_IMAGE
DAILY_IMAGE=$DAILY_IMAGE
EOF

bundle="$tmp_dir/briefs-bundle.tar.gz"
tar -czf "$bundle" docker/docker-compose.prod.yml docker/entrypoint-secrets.sh remote-cmd.sh

"${SSH_CMD[@]}" "docker --version >/dev/null && mkdir -p '$APP_DIR' '$APP_DIR/secrets' && chmod 700 '$APP_DIR/secrets'"
"${SCP_BASE[@]}" "$bundle" "$DEPLOY_USER@$DROPLET_IP:$APP_DIR/.deploy-bundle.tar.gz"
"${SSH_CMD[@]}" "cd '$APP_DIR' && tar -xzf .deploy-bundle.tar.gz && rm -f .deploy-bundle.tar.gz"
"${SCP_BASE[@]}" "$tmp_dir/.env" "$DEPLOY_USER@$DROPLET_IP:$APP_DIR/.env"

deliver_secret() {
  printf '%s' "$2" | "${SSH_CMD[@]}" "cat > '$APP_DIR/secrets/$1' && chmod 600 '$APP_DIR/secrets/$1'"
}

deliver_secret postgres_password "$POSTGRES_PASSWORD"
deliver_secret database_url "$DATABASE_URL"
deliver_secret auth_secret "$AUTH_SECRET"
deliver_secret session_secret "$SESSION_SECRET"
deliver_secret resend_api_key "$RESEND_API_KEY"
deliver_secret email_from "${EMAIL_FROM:?EMAIL_FROM is required}"

"${SSH_CMD[@]}" "cd '$APP_DIR' && docker compose --env-file .env -f docker-compose.prod.yml up -d --remove-orphans"
echo "Deploy complete. Run: npm run remote:status"
