# Docker deployment

Run the full Brief stack (Postgres, Redis, API, web UI) with Docker Compose.

## Prerequisites

- Docker Engine with Compose v2
- Optional: copy `.env.example` to `.env` for overrides (auth, public URL, ports)

## Quick start

```bash
# Build and start postgres + redis + brief + web
npm run docker:up

# Health check
curl http://localhost:8000/health

# Web UI
open http://localhost:3100

# Tear down (keeps volumes)
npm run docker:down
```

| Service | URL |
|---------|-----|
| Web UI | `http://localhost:3100` |
| API | `http://localhost:8000/api/v1` |
| MCP | `http://localhost:8000/mcp` |
| Health | `http://localhost:8000/health` |

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run db:up` | Postgres + Redis only (for local `npm run dev`) |
| `npm run docker:up` | Full stack including Brief API + Next.js web |
| `npm run docker:down` | Stop all compose services |
| `npm run docker:build` | Build Brief + web images without starting |
| `npm run docker:logs` | Tail `brief` and `web` container logs |
| `npm run docker:secrets` | Full stack with Infisical `dev` secrets injected |
| `npm run bootstrap:secrets` | Seed Infisical secret slots for dev/prod |
| `npm run deploy` | Manual production deploy to droplet |
| `npm run remote:status` | Check production container status |
| `npm run dev:web` | Next.js on host (hybrid dev; API in Docker or `npm run dev`) |

## Local dev vs container

**Hybrid (recommended for development):**

```bash
npm run db:up      # databases in Docker
npm run dev        # API on host with hot reload
npm run dev:web    # Next.js on host with hot reload
```

**Full container:**

```bash
npm run docker:up  # everything in Docker
```

Rebuild after code changes:

```bash
docker compose build brief web
docker compose up -d brief web
```

## Environment

Compose wires internal service URLs automatically:

| Variable | In compose |
|----------|------------|
| `BRIEF_DATABASE_URL` | `postgresql://brief:brief@postgres:5432/brief` |
| `BRIEF_REDIS_URL` | `redis://redis:6379` |
| `BRIEF_HOST` | `0.0.0.0` |
| `BRIEF_MCP_AUTH_DISABLED` | `true` (override for local container testing) |
| `BRIEF_ALLOWED_HOSTS` | `brief,brief:8000` on `brief` service (internal web proxy) |
| `BRIEF_API_URL` (web) | `http://brief:8000` — internal API proxy target |
| `BRIEF_WEB_PORT` | Host port for web UI (default `3100`) |
| `BRIEF_PORT` | Host port for API/MCP (default `8000`) |

For production (`BRIEF_ENV=production`), set `BRIEF_MCP_AUTH_DISABLED=false` (or unset it) and provide `BRIEF_AUTH_ADMIN_SECRET` or `BRIEF_MCP_STATIC_TOKENS`. See [trust.md](trust.md).

## Images

**Brief API** — multi-stage `Dockerfile` at repo root:

1. `deps` — production `node_modules`
2. `build` — TypeScript compile to `dist/`
3. `runtime` — non-root `brief` user, `db/migrations` for schema init

**Web** — multi-stage `web/Dockerfile`:

1. `deps` — install dependencies
2. `build` — `next build` with `output: standalone`
3. `runtime` — non-root `web` user, `node server.js` on port 3000

The web container proxies browser `/api/v1/*` requests to the `brief` service on the Docker network.

## Infisical (optional for local dev)

Brief follows the [mcp-oauth-stack](https://github.com/holmplanet/mcp-oauth-stack) secrets pattern. See [INFISICAL.md](../INFISICAL.md).

```bash
infisical login
infisical init
npm run bootstrap:secrets dev
npm run docker:secrets   # inject dev secrets into compose
```

`npm run docker:up` still works without Infisical for quick local testing.

## Production deploy

Production uses `docker-compose.prod.yml`, Infisical `prod` secrets, and a manual deploy to a DigitalOcean droplet.

### Prerequisites

- Infisical `prod` secrets seeded (`npm run bootstrap:secrets prod`)
- Deploy machine env from `.env.example.prod` (runtime config + deploy credentials)
- Prebuilt images uploaded to the droplet

### Build and export images

```bash
export BRIEF_IMAGE=brief-brief:prod
export BRIEF_WEB_IMAGE=brief-web:prod
docker compose build brief web
docker tag brief-brief:latest "$BRIEF_IMAGE"
docker tag brief-web:latest "$BRIEF_WEB_IMAGE"
docker save "$BRIEF_IMAGE" | gzip > /tmp/brief-api.tar.gz
docker save "$BRIEF_WEB_IMAGE" | gzip > /tmp/brief-web.tar.gz

export BRIEF_IMAGE_ARCHIVE=/tmp/brief-api.tar.gz
export BRIEF_WEB_IMAGE_ARCHIVE=/tmp/brief-web.tar.gz
```

### Deploy

```bash
# Set BRIEF_PUBLIC_URL, DROPLET_IP, Infisical deploy creds, SSH_KNOWN_HOSTS_FILE, etc.
./deploy.sh
```

### Remote ops

```bash
npm run remote:status
npm run remote:logs
npm run remote:restart
```

Production services bind to loopback (`127.0.0.1`) — put Nginx + TLS in front (follow-up in #20).

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `brief` exits on start | `docker compose logs brief` — usually DB not ready (should wait on healthchecks) |
| `web` exits on start | `docker compose logs web` — often API not healthy yet |
| Web shows API errors | Confirm `brief` is healthy; web uses `http://brief:8000` internally |
| Port 8000 in use | Set `BRIEF_PORT=8001` in `.env` and restart compose |
| Port 3100 in use | Set `BRIEF_WEB_PORT=3101` in `.env` and restart compose |
| Schema errors | Postgres volume may be stale — `docker compose down -v` (destroys data) |
