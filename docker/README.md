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

Ports are `8001` (System), `3334` (MCP), and `3000` (Daily). Set `APP_ENV=production`, a real
`AUTH_SECRET`, `NODE_ENV=production`, `MCP_DEV_SKIP_AUTH=false`, and the Resend/database settings before
using this compose file beyond local development. Also set `OAUTH_ISSUER` and
`AUTH_DEV_BYPASS=false` for Daily. The defaults are intentionally development-only.

For a production-shaped configuration, copy `docker/production.env.example` to `.env`, replace every
placeholder, and verify the OAuth redirect URI matches the registered Daily client. Then run:

```bash
docker compose --env-file .env -f docker/docker-compose.yml config
docker compose --env-file .env -f docker/docker-compose.yml up -d --build
```

The compose file is a deployment baseline, not a complete public ingress setup. Put TLS and a
single public hostname in front of the services, keep Postgres private, and verify `/health`,
Daily login, MCP bearer auth, and a real OTP delivery before calling the deployment production-ready.
