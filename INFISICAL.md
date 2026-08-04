# Infisical Reference

Brief uses two config channels, matching [mcp-oauth-stack](https://github.com/holmplanet/mcp-oauth-stack):

1. Non-secret runtime config in `.env`
2. Secrets in Infisical

Branch policy:

- `main` is the production deployment branch.
- All other branches use the `dev` Infisical environment plus local Docker Compose.

## Put These In `.env`

Non-secret app/runtime settings. See `.env.example` for local development and `.env.example.prod` for production reference values.

### Local development

```env
BRIEF_ENV=development
BRIEF_HOST=0.0.0.0
BRIEF_PORT=8000
BRIEF_PUBLIC_URL=http://localhost:8000
BRIEF_GRAPH_CACHE_TTL_SECONDS=60
BRIEF_MCP_AUTH_DISABLED=true
BRIEF_WEB_PORT=3100
BRIEF_ALLOWED_HOSTS=brief,brief:8000
```

### Production runtime

Provide these in the shell environment or a local deploy-only env file — never commit them:

```env
BRIEF_ENV=production
BRIEF_HOST=0.0.0.0
BRIEF_PORT=8000
BRIEF_PUBLIC_URL=https://brief.yourdomain.com
BRIEF_GRAPH_CACHE_TTL_SECONDS=60
BRIEF_MCP_AUTH_DISABLED=false
BRIEF_ALLOWED_HOSTS=brief,brief:8000,brief.yourdomain.com
BRIEF_WEB_PORT=3100
```

## Put These In Infisical

Secrets. In local development they are injected with:

```bash
npm run docker:secrets
```

In production they are fetched during `deploy.sh` and written to Docker secret files on the droplet.

### `dev` environment

```text
BRIEF_DATABASE_URL
BRIEF_REDIS_URL
BRIEF_AUTH_ADMIN_SECRET
BRIEF_MCP_STATIC_TOKENS
```

Notes:

- `BRIEF_DATABASE_URL` — `postgresql://brief:brief@localhost:5432/brief` when using `npm run db:up`
- `BRIEF_REDIS_URL` — `redis://localhost:6379`
- `BRIEF_AUTH_ADMIN_SECRET` — any string for local MCP token minting
- `BRIEF_MCP_STATIC_TOKENS` — optional; e.g. `demo-user:brief_dev_token_demo`

### `prod` environment

```text
POSTGRES_PASSWORD
BRIEF_AUTH_ADMIN_SECRET
BRIEF_MCP_STATIC_TOKENS
```

Notes:

- `POSTGRES_PASSWORD` — used to build `BRIEF_DATABASE_URL` during deploy
- `BRIEF_AUTH_ADMIN_SECRET` — generate with `openssl rand -hex 32`
- `BRIEF_MCP_STATIC_TOKENS` — optional static MCP tokens for dogfood users

## Deploy-Only Inputs Outside Infisical

Used by the machine running the manual deployment:

```text
SSH_KEY_PATH
SSH_KNOWN_HOSTS_FILE
DROPLET_IP
INFISICAL_CLIENT_ID
INFISICAL_CLIENT_SECRET
INFISICAL_PROJECT_ID
INFISICAL_SITE_URL
BRIEF_IMAGE
BRIEF_WEB_IMAGE
BRIEF_IMAGE_ARCHIVE
BRIEF_WEB_IMAGE_ARCHIVE
```

Production Compose is image-only. Images are built locally and uploaded to the droplet during deploy.

## Source Of Truth In Code

- Runtime secret loading: `src/loadEnv.ts`
- Infisical bootstrap placeholders: `scripts/bootstrap-secrets.sh`
- Manual deploy entrypoint: `deploy.sh`
- Production Compose: `docker-compose.prod.yml`
