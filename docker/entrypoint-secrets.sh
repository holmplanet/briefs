#!/bin/sh
set -eu

load_secret() {
  name="$1"
  path="$2"
  eval "current=\${$name-}"
  if [ -z "$current" ] && [ -f "$path" ]; then
    value=$(cat "$path")
    export "$name=$value"
  fi
}

load_secret DATABASE_URL /run/secrets/database_url
load_secret AUTH_SECRET /run/secrets/auth_secret
load_secret SESSION_SECRET /run/secrets/session_secret
load_secret RESEND_API_KEY /run/secrets/resend_api_key
load_secret EMAIL_FROM /run/secrets/email_from

exec "$@"
