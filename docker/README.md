# Docker

Local Postgres + `@briefs/system` API.

```bash
# From repo root
npm run db:up        # postgres only
npm run docker:up    # postgres + system (builds from docker/Dockerfile)
npm run docker:logs
npm run docker:down
```

Compose file: `docker/docker-compose.yml` (build context is repo root).
