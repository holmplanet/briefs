# Docker deployment

Run the full Brief stack (Postgres, Redis, app) with Docker Compose.

## Prerequisites

- Docker Engine with Compose v2
- Optional: copy `.env.example` to `.env` for overrides (weather coords, Google OAuth, auth)

## Quick start

```bash
# Build and start postgres + redis + brief
npm run docker:up

# Health check
curl http://localhost:8000/health

# Tear down (keeps volumes)
npm run docker:down
```

MCP endpoint: `http://localhost:8000/mcp`

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run db:up` | Postgres + Redis only (for local `npm run dev`) |
| `npm run docker:up` | Full stack including Brief container |
| `npm run docker:down` | Stop all compose services |
| `npm run docker:build` | Build the Brief image without starting |

## Local dev vs container

**Hybrid (recommended for development):**

```bash
npm run db:up      # databases in Docker
npm run dev        # app on host with hot reload
```

**Full container:**

```bash
npm run docker:up  # everything in Docker
```

Rebuild after code changes:

```bash
docker compose build brief
docker compose up -d brief
```

## Environment

Compose wires internal service URLs automatically:

| Variable | In compose |
|----------|------------|
| `BRIEF_DATABASE_URL` | `postgresql://brief:brief@postgres:5432/brief` |
| `BRIEF_REDIS_URL` | `redis://redis:6379` |
| `BRIEF_HOST` | `0.0.0.0` |
| `BRIEF_MCP_AUTH_DISABLED` | `true` (override for local container testing) |

Set weather coordinates and optional Google OAuth in `.env` at the repo root — Compose passes them through to the `brief` service.

For production (`BRIEF_ENV=production`), set `BRIEF_MCP_AUTH_DISABLED=false` (or unset it) and provide `BRIEF_AUTH_ADMIN_SECRET` or `BRIEF_MCP_STATIC_TOKENS`. See [trust.md](trust.md).

## Image

Multi-stage `Dockerfile`:

1. `deps` — production `node_modules`
2. `build` — TypeScript compile to `dist/`
3. `runtime` — non-root `brief` user, `db/migrations` for schema init

Health check: `GET /health` on port 8000.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `brief` exits on start | `docker compose logs brief` — usually DB not ready (should wait on healthchecks) |
| Empty weather sync | `BRIEF_WEATHER_LATITUDE` / `LONGITUDE` in `.env` |
| Port 8000 in use | Set `BRIEF_PORT=8001` in `.env` and restart compose |
| Schema errors | Postgres volume may be stale — `docker compose down -v` (destroys data) |
