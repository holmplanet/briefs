# Deployment environment templates

These files are the source of truth for deployment variables. They contain names and safe
placeholders only; never commit real secrets.

- `vercel.preview.env.example` — protected Vercel Preview with real OAuth/OTP testing.
- `vercel.production.env.example` — Vercel Production baseline.
- `docker.development.env.example` — local Docker Compose development.
- `docker.production.env.example` — Docker Compose production-shaped baseline.

Copy the relevant template into the deployment system's environment settings. For Vercel,
configure each variable in the matching Preview or Production environment. For Docker, copy the
template to `.env` and pass it with `docker compose --env-file .env`.

All deployment profiles use the provider-neutral `DATABASE_URL` contract. See
[`../docs/database.md`](../docs/database.md) for local Postgres, Neon, Supabase, and self-hosted
provider setup.

## Public self-hosting boundary

The production profile is designed for a small, intentionally private audience while remaining
reachable from the public internet for browser and MCP clients:

- Caddy is the only public ingress and publishes ports 80/443.
- Postgres, System, MCP, and Daily bind to the host's loopback interface and share a private
  Docker network.
- `AUTH_ALLOWED_EMAILS` is an explicit one- or two-address allowlist. An obscure hostname such
  as `<obscure-host>.holmplanet.com` reduces casual discovery but is not an access control.
- OAuth redirect URIs are exact allowlist entries; production development bypasses remain false.
- Infisical supplies secrets at deploy time. The repository, Pulumi config/state, and runtime
  env file contain no application secret values.

See [`../docs/deploy.md`](../docs/deploy.md) for the complete provisioning, verification, and
recovery sequence.
