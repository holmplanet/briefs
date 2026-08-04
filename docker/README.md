# Docker

Local Postgres + `@briefs/system` API. The image installs only `shared` and `system` workspaces (no Next.js), compiles with `tsc`, and runs `node system/dist/index.js` (no `tsx` / `esbuild` in production).

```bash
# From repo root
npm run db:up        # postgres only
npm run docker:up    # postgres + system (builds from docker/Dockerfile)
npm run docker:logs
npm run docker:down
```

Compose file: `docker/docker-compose.yml` (build context is repo root).
