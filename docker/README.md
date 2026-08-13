# Docker

Local Postgres + the Briefs core services. The System, MCP, and Daily images compile and run separately; the runtime containers do not use `tsx`.

```bash
# From repo root
npm run db:up        # postgres only
npm run docker:up    # postgres + system + MCP + Daily
npm run docker:logs
npm run docker:down
```

Compose file: `docker/docker-compose.yml` (build context is repo root).

Ports are `8001` (System), `3334` (MCP), and `3000` (Daily). Set `BRIEFS_ENV=production`, a real
`BRIEFS_AUTH_SECRET`, `NODE_ENV=production`, `BRIEFS_MCP_DEV_SKIP_AUTH=false`, and the Resend/database settings before
using this compose file beyond local development. Also set `BRIEFS_OAUTH_ISSUER` and
`BRIEFS_AUTH_DEV_BYPASS=false` for Daily. The defaults are intentionally development-only.
