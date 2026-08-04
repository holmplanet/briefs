# Docker

Local Postgres + `@briefs/system` API. The image installs only `shared` and `system` workspaces (no Next.js).

```bash
# From repo root
npm run db:up        # postgres only
npm run docker:up    # postgres + system (builds from docker/Dockerfile)
npm run docker:logs
npm run docker:down
```

Compose file: `docker/docker-compose.yml` (build context is repo root).
