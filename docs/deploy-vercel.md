# Deploy Briefs to Vercel

Briefs supports a Vercel hosted profile without changing the provider-neutral System or MCP
contracts. The Docker Compose path remains the self-hosted reference.

## Preview setup

Create a separate preview Postgres database and configure these variables in the Vercel Preview
environment:

```text
BRIEFS_ENV=development
BRIEFS_DATABASE_URL=postgres://...
BRIEFS_AUTH_SECRET=<preview-only-secret>
BRIEFS_SESSION_SECRET=<preview-only-secret>
BRIEFS_OAUTH_ISSUER=https://<preview-domain>/oauth
BRIEFS_OAUTH_CLIENT_ID=briefs-daily
BRIEFS_OAUTH_REDIRECT_URIS=https://<preview-domain>/auth/callback
BRIEFS_OTP_MAILER=console
BRIEFS_API_URL=https://<preview-domain>
BRIEFS_MCP_DEV_SKIP_AUTH=true
```

Use `BRIEFS_OTP_MAILER=resend`, a preview-only Resend sender, and `BRIEFS_MCP_DEV_SKIP_AUTH=false`
only when testing the authenticated OAuth flow. Never point Preview at production Postgres.

## Project settings

The repository root is the Vercel project root. `vercel.json` builds the System and MCP workspace
packages before the Daily Next.js app and writes output to `client/web/daily/.next`.

The hosted surfaces are:

- `/` — Daily UI
- `/api/health` — deployment health
- `/api/v1/*` — System API adapter
- `/api/mcp` — stateless Streamable HTTP MCP adapter
- `/oauth/*` — Briefs OAuth issuer

After deployment, smoke-test health, OAuth discovery, MCP initialize, an authenticated item create,
item activities, and Daily item rendering before connecting a custom domain.
