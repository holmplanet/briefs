# Authentication

Briefs uses its System service as the OAuth 2.1 issuer. Daily is the browser client;
MCP and other integrations use the resulting bearer access token. The current hosted
flow uses email OTP, but the client contract is an OAuth issuer and can support another
provider in the future.

## Local development

When `OAUTH_ISSUER` is unset outside production, Daily and the local API can use
the configured development user and System/MCP can use their explicit local bypasses. This
is intended only for local work. Do not copy these bypass settings into a hosted environment.

```bash
npm run db:up
npm run dev:system
npm run dev:flight
npm run dev:mcp
```

The local defaults are:

- Daily: `http://localhost:3000`
- System: `http://localhost:8001`
- MCP: `http://localhost:3334/mcp`

To exercise the real OAuth flow locally, set `OAUTH_ISSUER`, `OAUTH_CLIENT_ID`,
`OAUTH_REDIRECT_URIS`, `AUTH_SECRET`, and `SESSION_SECRET`, then disable the bypass flags.

The Better Auth validation path is opt-in:

```dotenv
AUTH_PROVIDER=better-auth
MCP_RESOURCE=http://localhost:3334/mcp
API_RESOURCE=http://localhost:8001/api
```

Leave `AUTH_PROVIDER` unset (or set it to `legacy`) to use the current implementation.

## Production

Production requires:

- `AUTH_PROVIDER=better-auth` when enabling the validation provider
- `OAUTH_ISSUER`
- `AUTH_SECRET`
- `SESSION_SECRET`
- `AUTH_ALLOWED_EMAILS`
- `OAUTH_REDIRECT_URIS`
- a real OTP mailer such as Resend

The API and MCP adapter accept OAuth access tokens. Daily stores a signed, httpOnly
session cookie and refreshes access tokens when they approach expiration. The
Better Auth `AUTH_SECRET` encrypts its persisted JWKS private key and signs provider tokens;
changing it while retaining the Better Auth database invalidates the issuer's key material.
`SESSION_SECRET` signs Daily's browser session. Keep them separate and use different values
for Preview and Production. Set `MCP_RESOURCE` and `API_RESOURCE` to the exact HTTPS resource
origins used by the MCP and System services.

The production bypass settings must all be false:

```dotenv
API_DEV_BYPASS=false
AUTH_DEV_BYPASS=false
MCP_DEV_SKIP_AUTH=false
```

## Email policy

`AUTH_ALLOWED_EMAILS` is a comma-separated list of normalized email addresses.
The production server fails to start when the list is missing or empty. A future
public-signup mode should be designed and enabled explicitly rather than inferred
from an empty configuration value.

Better Auth email OTPs expire after 10 minutes, allow five verification attempts, and use
the provider's production rate limiting. The current validation configuration uses in-memory
rate-limit storage; this is appropriate for the single System instance in the Docker deployment,
but must be replaced with shared storage before scaling the issuer horizontally or using a
serverless deployment.

## OAuth redirect checklist

The registered redirect URI must exactly match `${APP_URL}/auth/callback`. Use the
deployment's own URL for Preview and Production. Do not use a Preview callback for
Production or share a database between the two environments.

## Rollout and rollback

1. Create an isolated Preview database and set `AUTH_PROVIDER=better-auth` there.
2. Run the migration, then verify discovery, Daily OTP login, an authenticated API request,
   MCP initialize, refresh-token exchange, and rejection of wrong-audience tokens.
3. Promote the same immutable image and migration to Production with a Production-only
   database, stable `AUTH_SECRET`, exact HTTPS redirect/resource values, and all bypasses false.
4. Record the previous image tag and database backup before switching the flag.

Rollback is an image/config rollback to the previous provider. Better Auth tables can remain
in place, but tokens and sessions issued by the new provider should be treated as invalid after
rollback; users may need to sign in again. Never roll back by changing `AUTH_SECRET` or by
restoring a production database over the only live copy.
