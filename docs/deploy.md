# Production deployment

Briefs production is an image-only Docker Compose deployment on a DigitalOcean droplet. The
droplet runs Postgres, System, MCP, and Daily on a private Docker network. The application ports
bind to loopback; Nginx/TLS should be the only public ingress and is a follow-up to this baseline.

## Prerequisites

- A DigitalOcean droplet with Docker and Compose installed.
- A deploy user with SSH access.
- Strict SSH host verification via `SSH_KNOWN_HOSTS_FILE`.
- Infisical Universal Auth credentials with access to the Briefs project.
- Production OAuth redirect URI and Resend sender/API key.
- Prebuilt images published to a registry accessible by the droplet.

## Configure

Copy `docker/.env.example.prod` to a local, ignored `.env` and set the public URLs and image
references. Export deploy-only variables:

```bash
export DROPLET_IP=203.0.113.10
export SSH_KEY_PATH="$HOME/.ssh/briefs"
export SSH_KNOWN_HOSTS_FILE="$HOME/.ssh/known_hosts"
export INFISICAL_SITE_URL=https://app.infisical.com
export INFISICAL_PROJECT_ID=...
export INFISICAL_CLIENT_ID=...
export INFISICAL_CLIENT_SECRET=...
```

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

1. `npm run remote:status` shows Postgres, System, MCP, and Daily healthy.
2. Nginx/TLS routes `/`, `/oauth`, and `/mcp` to the appropriate loopback services.
3. Daily login sends and accepts a real OTP.
4. MCP accepts a valid bearer token and rejects missing/invalid tokens.
5. System ignores `X-Briefs-User-Id` in production.
6. Create an item through MCP and verify it plus its activity in Daily.
