#!/usr/bin/env bash
set -euo pipefail
umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="${APP_DIR:-/home/${DEPLOY_USER}/briefs}"
INFISICAL_ENV="${INFISICAL_ENV:-prod}"
INFISICAL_API_URL="${INFISICAL_API_URL:-${INFISICAL_SITE_URL:-https://app.infisical.com}}"
INFISICAL_SECRET_PATH="${INFISICAL_SECRET_PATH:-/}"
RUNTIME_ENV_FILE="${RUNTIME_ENV_FILE:-$ROOT_DIR/deploy/docker.production.env}"
DEPLOY_CONTEXT_FILE="${DEPLOY_CONTEXT_FILE:-$ROOT_DIR/deploy/.deploy.local}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/hive}"
SSH_KNOWN_HOSTS_FILE="${SSH_KNOWN_HOSTS_FILE:-$HOME/.ssh/known_hosts}"

[[ -f "$RUNTIME_ENV_FILE" ]] || { echo "ERROR: RUNTIME_ENV_FILE does not exist: $RUNTIME_ENV_FILE" >&2; exit 1; }

RUNTIME_ENV_SOURCE_FILE="$RUNTIME_ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$RUNTIME_ENV_SOURCE_FILE"
set +a
RUNTIME_ENV_FILE="$RUNTIME_ENV_SOURCE_FILE"

if [[ -f "$DEPLOY_CONTEXT_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$DEPLOY_CONTEXT_FILE"
  set +a
fi

: "${DROPLET_IP:?DROPLET_IP is required}"
: "${NEXT_PUBLIC_API_URL:?NEXT_PUBLIC_API_URL is required}"
: "${NEXT_PUBLIC_MCP_URL:?NEXT_PUBLIC_MCP_URL is required}"
: "${NEXT_PUBLIC_DOCS_URL:=https://briefs.holmplanet.com}"
: "${APP_DOMAIN:?APP_DOMAIN is required}"

command -v docker >/dev/null || { echo "ERROR: docker is required" >&2; exit 1; }
command -v infisical >/dev/null || { echo "ERROR: infisical CLI is required" >&2; exit 1; }
[[ -f "$SSH_KNOWN_HOSTS_FILE" ]] || { echo "ERROR: SSH_KNOWN_HOSTS_FILE does not exist" >&2; exit 1; }
[[ -f "$SSH_KEY_PATH" ]] || { echo "ERROR: SSH_KEY_PATH does not exist" >&2; exit 1; }

if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
  echo "ERROR: working tree must be clean before deployment" >&2
  git -C "$ROOT_DIR" status --short >&2
  exit 1
fi

if grep -Eq '^[[:space:]]*(export[[:space:]]+)?(DATABASE_URL|AUTH_SECRET|SESSION_SECRET|RESEND_API_KEY|POSTGRES_PASSWORD)=' "$RUNTIME_ENV_FILE"; then
  echo "ERROR: runtime env must not contain secret variables" >&2
  exit 1
fi

SSH=(ssh -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$SSH_KNOWN_HOSTS_FILE" -i "$SSH_KEY_PATH" "$DEPLOY_USER@$DROPLET_IP")
SCP=(scp -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$SSH_KNOWN_HOSTS_FILE" -i "$SSH_KEY_PATH")
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

: "${INFISICAL_PROJECT_ID:?INFISICAL_PROJECT_ID is required}"

if [[ -z "${INFISICAL_TOKEN:-}" ]]; then
  if [[ -n "${INFISICAL_UNIVERSAL_AUTH_CLIENT_ID:-}" || -n "${INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET:-}" ]]; then
    : "${INFISICAL_UNIVERSAL_AUTH_CLIENT_ID:?INFISICAL_UNIVERSAL_AUTH_CLIENT_ID is required when using Universal Auth}"
    : "${INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET:?INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET is required when using Universal Auth}"
    INFISICAL_TOKEN="$(INFISICAL_API_URL="$INFISICAL_API_URL" INFISICAL_DISABLE_UPDATE_CHECK=true infisical login \
      --method=universal-auth \
      --client-id="$INFISICAL_UNIVERSAL_AUTH_CLIENT_ID" \
      --client-secret="$INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET" \
      --silent --plain)"
    export INFISICAL_TOKEN
  else
    echo "Using the existing human Infisical CLI session." >&2
  fi
fi
export INFISICAL_API_URL INFISICAL_DISABLE_UPDATE_CHECK=true

SECRET_JSON="$WORK_DIR/secrets.json"
if [[ -n "${INFISICAL_TOKEN:-}" ]]; then
  infisical export \
    --projectId="$INFISICAL_PROJECT_ID" \
    --env="$INFISICAL_ENV" \
    --path="$INFISICAL_SECRET_PATH" \
    --format=json \
    --output-file="$SECRET_JSON" >/dev/null
else
  infisical export \
    --projectId="$INFISICAL_PROJECT_ID" \
    --env="$INFISICAL_ENV" \
    --path="$INFISICAL_SECRET_PATH" \
    --format=json \
    --output-file="$SECRET_JSON" >/dev/null
fi

SECRET_DIR="$WORK_DIR/secrets"
mkdir -m 700 "$SECRET_DIR"
node - "$SECRET_JSON" "$SECRET_DIR" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const [jsonPath, outputDir] = process.argv.slice(2);
const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const values = raw.secrets ?? raw;
const get = (name) => {
  if (Array.isArray(values)) {
    const entry = values.find((item) => item.secretKey === name || item.key === name || item.name === name);
    return entry?.secretValue ?? entry?.value;
  }
  return values[name];
};

const required = ["POSTGRES_PASSWORD", "AUTH_SECRET", "SESSION_SECRET", "RESEND_API_KEY"];
for (const name of required) {
  const value = get(name);
  if (typeof value !== "string" || value.length === 0) throw new Error(`Missing Infisical secret: ${name}`);
  fs.writeFileSync(path.join(outputDir, name.toLowerCase()), value, { mode: 0o600 });
}

const password = get("POSTGRES_PASSWORD");
const databaseUrl = `postgresql://briefs:${encodeURIComponent(password)}@postgres:5432/briefs`;
fs.writeFileSync(path.join(outputDir, "database_url"), databaseUrl, { mode: 0o600 });
NODE

IMAGE_TAG="${IMAGE_TAG:-$(git -C "$ROOT_DIR" rev-parse --short=12 HEAD)}"
TARGET_PLATFORM="${TARGET_PLATFORM:-linux/amd64}"
docker build --platform "$TARGET_PLATFORM" -f "$ROOT_DIR/docker/Dockerfile" -t "briefs-system:$IMAGE_TAG" "$ROOT_DIR"
docker build --platform "$TARGET_PLATFORM" -f "$ROOT_DIR/docker/Dockerfile.mcp" -t "briefs-mcp:$IMAGE_TAG" "$ROOT_DIR"
docker build --platform "$TARGET_PLATFORM" -f "$ROOT_DIR/docker/Dockerfile.daily" \
  --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
  --build-arg NEXT_PUBLIC_MCP_URL="$NEXT_PUBLIC_MCP_URL" \
  --build-arg NEXT_PUBLIC_DOCS_URL="$NEXT_PUBLIC_DOCS_URL" \
  -t "briefs-daily:$IMAGE_TAG" "$ROOT_DIR"

sed -E '/^(SYSTEM_IMAGE|MCP_IMAGE|DAILY_IMAGE)=/d' "$RUNTIME_ENV_FILE" > "$WORK_DIR/.env"
printf '%s\n' \
  "SYSTEM_IMAGE=briefs-system:$IMAGE_TAG" \
  "MCP_IMAGE=briefs-mcp:$IMAGE_TAG" \
  "DAILY_IMAGE=briefs-daily:$IMAGE_TAG" >> "$WORK_DIR/.env"

docker save -o "$WORK_DIR/system.tar" "briefs-system:$IMAGE_TAG"
docker save -o "$WORK_DIR/mcp.tar" "briefs-mcp:$IMAGE_TAG"
docker save -o "$WORK_DIR/daily.tar" "briefs-daily:$IMAGE_TAG"

"${SSH[@]}" "mkdir -p '$APP_DIR/secrets' /tmp/briefs-deploy && chmod 700 '$APP_DIR/secrets'"
"${SCP[@]}" "$ROOT_DIR/docker/docker-compose.prod.yml" "$ROOT_DIR/docker/Caddyfile" "$WORK_DIR/.env" "$DEPLOY_USER@$DROPLET_IP:/tmp/briefs-deploy/"
"${SSH[@]}" "install -m 600 /tmp/briefs-deploy/.env '$APP_DIR/.env' && install -m 644 /tmp/briefs-deploy/docker-compose.prod.yml '$APP_DIR/docker-compose.prod.yml' && install -m 644 /tmp/briefs-deploy/Caddyfile '$APP_DIR/Caddyfile' && rm -rf /tmp/briefs-deploy"

for image in system mcp daily; do
  "${SCP[@]}" "$WORK_DIR/$image.tar" "$DEPLOY_USER@$DROPLET_IP:/tmp/briefs-$image.tar"
  "${SSH[@]}" "docker load -i /tmp/briefs-$image.tar >/dev/null && rm -f /tmp/briefs-$image.tar"
done

for secret in postgres_password auth_secret session_secret resend_api_key database_url; do
  "${SSH[@]}" "umask 077; tmp=\$(mktemp '$APP_DIR/secrets/.$secret.tmp.XXXXXX'); trap 'rm -f \"\$tmp\"' EXIT; cat > \"\$tmp\"; install -m 600 \"\$tmp\" '$APP_DIR/secrets/$secret'" < "$SECRET_DIR/$secret"
done

"${SSH[@]}" "cd '$APP_DIR' && docker compose --env-file .env -f docker-compose.prod.yml config --quiet && docker compose --env-file .env -f docker-compose.prod.yml up -d"
echo "Deployed Briefs images at $IMAGE_TAG to $DROPLET_IP"
