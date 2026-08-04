#!/usr/bin/env bash
# deploy.sh — deploys the full Brief stack to a DigitalOcean droplet
#
# Manual deploy entrypoint.
# Runtime app config is copied to the droplet, while deploy-only credentials
# stay on the machine running this script.

set -euo pipefail

INFISICAL_ENV="${INFISICAL_ENV:-prod}"
COMPOSE_FILE="docker-compose.prod.yml"

REQUIRED_VARS=(DROPLET_IP INFISICAL_CLIENT_ID INFISICAL_CLIENT_SECRET INFISICAL_PROJECT_ID INFISICAL_SITE_URL)
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERROR: $var is not set in the environment or .env" >&2
    exit 1
  fi
done

for var in BRIEF_IMAGE BRIEF_WEB_IMAGE BRIEF_IMAGE_ARCHIVE BRIEF_WEB_IMAGE_ARCHIVE; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERROR: $var is required for production deploys." >&2
    exit 1
  fi
done

DEPLOY_USER="deploy"
APP_DIR="/opt/brief"

SSH_BASE=(ssh)
SCP_BASE=(scp)
if [[ -n "${SSH_KEY_PATH:-}" ]]; then
  SSH_BASE+=(-i "$SSH_KEY_PATH")
  SCP_BASE+=(-i "$SSH_KEY_PATH")
fi
if [[ -z "${SSH_KNOWN_HOSTS_FILE:-}" ]]; then
  echo "ERROR: SSH_KNOWN_HOSTS_FILE is required for strict SSH host verification." >&2
  exit 1
fi
SSH_BASE+=(-o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$SSH_KNOWN_HOSTS_FILE")
SCP_BASE+=(-o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$SSH_KNOWN_HOSTS_FILE")

SSH_CMD=("${SSH_BASE[@]}" "$DEPLOY_USER@$DROPLET_IP")

REQUIRED_RUNTIME_ENV_KEYS=(
  BRIEF_ENV
  BRIEF_HOST
  BRIEF_PORT
  BRIEF_PUBLIC_URL
  BRIEF_GRAPH_CACHE_TTL_SECONDS
  BRIEF_MCP_AUTH_DISABLED
  BRIEF_ALLOWED_HOSTS
  BRIEF_WEB_PORT
)

RUNTIME_ENV_KEYS=(
  "${REQUIRED_RUNTIME_ENV_KEYS[@]}"
  BRIEF_IMAGE
  BRIEF_WEB_IMAGE
)

BUNDLE_PATHS=(
  db
  docker-compose.prod.yml
)

require_runtime_env() {
  for var in "${REQUIRED_RUNTIME_ENV_KEYS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      echo "ERROR: $var must be set for the remote runtime env file" >&2
      exit 1
    fi
  done
}

write_runtime_env() {
  local target="$1"
  : > "$target"
  for var in "${RUNTIME_ENV_KEYS[@]}"; do
    printf '%s=%s\n' "$var" "${!var:-}" >> "$target"
  done
}

create_deploy_bundle() {
  local target="$1"
  tar -czf "$target" "${BUNDLE_PATHS[@]}"
}

echo "▶ Deploying Brief to $DROPLET_IP …"

# ─── 1. Fetch secrets from Infisical ─────────────────────────────────────────
echo "▶ Fetching secrets from Infisical …"

INFISICAL_TOKEN=$(curl -sf -X POST "$INFISICAL_SITE_URL/api/v1/auth/universal-auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"clientId\":\"$INFISICAL_CLIENT_ID\",\"clientSecret\":\"$INFISICAL_CLIENT_SECRET\"}" \
  | jq -r '.accessToken')

[[ -z "$INFISICAL_TOKEN" || "$INFISICAL_TOKEN" == "null" ]] && { echo "ERROR: Infisical auth failed" >&2; exit 1; }

_secret() {
  curl -sf "$INFISICAL_SITE_URL/api/v3/secrets/raw/$1?workspaceId=$INFISICAL_PROJECT_ID&environment=$INFISICAL_ENV" \
    -H "Authorization: Bearer $INFISICAL_TOKEN" \
    | jq -r '.secret.secretValue'
}

POSTGRES_PASSWORD=$(_secret "POSTGRES_PASSWORD")
BRIEF_AUTH_ADMIN_SECRET=$(_secret "BRIEF_AUTH_ADMIN_SECRET")
BRIEF_MCP_STATIC_TOKENS=$(_secret "BRIEF_MCP_STATIC_TOKENS")
DATABASE_URL="postgresql://brief:${POSTGRES_PASSWORD}@postgres:5432/brief"

echo "✓ Secrets fetched"

# ─── 2. Verify Docker is installed ───────────────────────────────────────────
"${SSH_CMD[@]}" "docker --version > /dev/null 2>&1 || (echo 'Docker not installed' && exit 1)"
echo "✓ Docker OK"

# ─── 3. Upload release bundle ────────────────────────────────────────────────
TMP_BUNDLE_FILE="${DEPLOY_BUNDLE_ARCHIVE:-$(mktemp "${TMPDIR:-/tmp}/brief-bundle.XXXXXX.tar.gz")}"
TMP_ENV_FILE="$(mktemp)"
trap 'if [[ -z "${DEPLOY_BUNDLE_ARCHIVE:-}" && -f "$TMP_BUNDLE_FILE" ]]; then rm -f "$TMP_BUNDLE_FILE"; fi; if [[ -f "$TMP_ENV_FILE" ]]; then rm -f "$TMP_ENV_FILE"; fi' EXIT

if [[ -z "${DEPLOY_BUNDLE_ARCHIVE:-}" ]]; then
  echo "▶ Creating release bundle …"
  create_deploy_bundle "$TMP_BUNDLE_FILE"
  echo "✓ Bundle created"
elif [[ ! -f "$DEPLOY_BUNDLE_ARCHIVE" ]]; then
  echo "ERROR: DEPLOY_BUNDLE_ARCHIVE does not exist: $DEPLOY_BUNDLE_ARCHIVE" >&2
  exit 1
fi

echo "▶ Uploading release bundle …"
REMOTE_BUNDLE_ARCHIVE="$APP_DIR/.deploy-bundle.tar.gz"
"${SSH_CMD[@]}" "mkdir -p $APP_DIR"
"${SCP_BASE[@]}" "$TMP_BUNDLE_FILE" "$DEPLOY_USER@$DROPLET_IP:$REMOTE_BUNDLE_ARCHIVE"
"${SSH_CMD[@]}" "cd $APP_DIR && tar -xzf .deploy-bundle.tar.gz && rm -f .deploy-bundle.tar.gz"
echo "✓ Bundle uploaded"

# ─── 4. Copy non-secret env file ──────────────────────────────────────────────
require_runtime_env
write_runtime_env "$TMP_ENV_FILE"
"${SCP_BASE[@]}" "$TMP_ENV_FILE" "$DEPLOY_USER@$DROPLET_IP:$APP_DIR/.env"
echo "✓ Config copied"

# ─── 5. Upload prebuilt image archives ────────────────────────────────────────
for archive_var in BRIEF_IMAGE_ARCHIVE BRIEF_WEB_IMAGE_ARCHIVE; do
  archive_path="${!archive_var}"
  if [[ ! -f "$archive_path" ]]; then
    echo "ERROR: $archive_var does not exist: $archive_path" >&2
    exit 1
  fi
done

echo "▶ Uploading prebuilt API image archive …"
REMOTE_API_ARCHIVE="$APP_DIR/.deploy-brief-image.tar.gz"
"${SCP_BASE[@]}" "$BRIEF_IMAGE_ARCHIVE" "$DEPLOY_USER@$DROPLET_IP:$REMOTE_API_ARCHIVE"
"${SSH_CMD[@]}" "docker load -i $REMOTE_API_ARCHIVE && rm -f $REMOTE_API_ARCHIVE"
echo "✓ API image loaded"

echo "▶ Uploading prebuilt web image archive …"
REMOTE_WEB_ARCHIVE="$APP_DIR/.deploy-web-image.tar.gz"
"${SCP_BASE[@]}" "$BRIEF_WEB_IMAGE_ARCHIVE" "$DEPLOY_USER@$DROPLET_IP:$REMOTE_WEB_ARCHIVE"
"${SSH_CMD[@]}" "docker load -i $REMOTE_WEB_ARCHIVE && rm -f $REMOTE_WEB_ARCHIVE"
echo "✓ Web image loaded"

# ─── 6. Deliver Docker secrets via SSH stdin ──────────────────────────────────
echo "▶ Delivering secrets …"
"${SSH_CMD[@]}" "mkdir -p $APP_DIR/secrets && chmod 700 $APP_DIR/secrets"

_deliver() {
  printf '%s' "$2" \
    | "${SSH_CMD[@]}" "cat > $APP_DIR/secrets/$1 && chmod 600 $APP_DIR/secrets/$1"
}

_deliver "postgres_password" "$POSTGRES_PASSWORD"
_deliver "database_url" "$DATABASE_URL"
_deliver "auth_admin_secret" "$BRIEF_AUTH_ADMIN_SECRET"
_deliver "mcp_static_tokens" "$BRIEF_MCP_STATIC_TOKENS"
echo "✓ Secrets delivered"

# ─── 7. Start containers ─────────────────────────────────────────────────────
echo "▶ Starting containers …"
"${SSH_CMD[@]}" "cd $APP_DIR && docker image inspect '$BRIEF_IMAGE' >/dev/null 2>&1 && docker image inspect '$BRIEF_WEB_IMAGE' >/dev/null 2>&1 && docker compose -f $COMPOSE_FILE up -d --remove-orphans"

echo ""
echo "✅ Deploy complete!"
echo "   API: $BRIEF_PUBLIC_URL"
echo "   Web: http://127.0.0.1:${BRIEF_WEB_PORT:-3100} (loopback — put Nginx in front)"
