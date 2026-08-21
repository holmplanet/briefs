# Deploy Briefs to Vercel

Briefs supports a Vercel hosted profile without changing the provider-neutral System or MCP
contracts. The Docker Compose path remains the self-hosted reference.

## Preview setup

Use [`deploy/vercel.preview.env.example`](../deploy/vercel.preview.env.example) as the complete
Preview variable list. Create a separate Preview Postgres database and use Preview-only secrets.

Use `OTP_MAILER=resend`, a preview-only Resend sender, and `MCP_DEV_SKIP_AUTH=false`
only when testing the authenticated OAuth flow. Never point Preview at production Postgres.

Set Preview variables for both Preview and Production only when the value is deliberately
shared. `DATABASE_URL`, `AUTH_SECRET`, `SESSION_SECRET`, OAuth URLs, and Resend credentials
should normally be environment-specific.

## Project settings

The repository root is the Vercel project root. `vercel.json` installs from the lockfile, builds
the shared, System, MCP, and Daily workspaces, and writes output to `client/web/daily/.next`.
The Vercel project must provide the server-side variables from the matching deployment template;
`NEXT_PUBLIC_*` values are only for browser-visible URLs and must never contain secrets.

The hosted surfaces are:

- `/` — Daily UI
- `/api/health` — deployment health
- `/api/v1/*` — System API adapter
- `/api/mcp` — stateless Streamable HTTP MCP adapter
- `/oauth/*` — Briefs OAuth issuer

After deployment, smoke-test health, OAuth discovery, MCP initialize, an authenticated item create,
item activities, and Daily item rendering before connecting a custom domain.

For exact variable names, use [`deploy/vercel.preview.env.example`](../deploy/vercel.preview.env.example)
or [`deploy/vercel.production.env.example`](../deploy/vercel.production.env.example). For database
provider setup, see [`database.md`](database.md).
