# Production deployment

Briefs production is an image-only Docker Compose deployment on a DigitalOcean droplet. The
droplet runs Postgres, System, MCP, and Daily on a private Docker network. The application ports
bind to loopback; Caddy is the only public application ingress.

## Prerequisites

- A DigitalOcean droplet with Docker and Compose installed.
- A deploy user with SSH access.
- Strict SSH host verification via `SSH_KNOWN_HOSTS_FILE`.
- An authenticated Infisical CLI session with access to the Briefs project.
- Production OAuth redirect URI and Resend sender/API key.
- A local production runtime file at `deploy/docker.production.env`.

Briefs uses standard PostgreSQL through `DATABASE_URL`; see [`docs/database.md`](database.md) for
Neon, Supabase, local, and self-hosted provider examples.

## Configure

Copy `deploy/docker.production.env.example` to `deploy/docker.production.env` and set the public
URLs and sender configuration. This file is ignored by Git and must contain non-secret runtime
configuration only. Export deploy-only variables in the same shell that runs the deploy:

```bash
export DROPLET_IP=203.0.113.10
export SSH_KEY_PATH="$HOME/.ssh/briefs"
export SSH_KNOWN_HOSTS_FILE="$HOME/.ssh/known_hosts"
export INFISICAL_API_URL=https://app.infisical.com
export INFISICAL_PROJECT_ID=...
export INFISICAL_ENV=prod
```

Authenticate the Infisical CLI as your human user before deploying with `infisical login`. The
CLI preserves the session in the local system keyring. The project ID is local deploy context;
do not commit it with credentials or add it to `deploy/docker.production.env`. The application
secrets remain in Infisical's `prod` environment (displayed as Production) and are installed by `deploy.sh` as
`0600` Docker secret files.

For unattended automation, `INFISICAL_TOKEN` or Universal Auth variables remain supported as an
explicit fallback. They are not required for the normal human deployment path.

Seed or validate the Infisical environment with `npm run bootstrap:secrets`, then run
`npm run deploy`. The deploy script fetches secrets, uploads the Compose bundle, writes Docker
secret files with mode `0600`, and starts the image-only stack. It does not print secret values.

## Remote operations

```bash
npm run remote:status
npm run remote:logs
npm run remote:restart
npm run remote:stop
npm run remote:start
```

## Smoke checklist

1. `npm run remote:status` shows Postgres, System, MCP, Daily, and Caddy healthy.
2. Caddy/TLS routes the private hostname to Daily.
3. Daily login sends and accepts a real OTP.
4. MCP accepts a valid bearer token and rejects missing/invalid tokens.
5. System ignores `X-Briefs-User-Id` in production.
6. Create an item through MCP and verify it plus its activity in Daily.
