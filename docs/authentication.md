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
npm run dev:daily
npm run dev:mcp
```

The local defaults are:

- Daily: `http://localhost:3000`
- System: `http://localhost:8001`
- MCP: `http://localhost:3334/mcp`

To exercise the real OAuth flow locally, set `OAUTH_ISSUER`, `OAUTH_CLIENT_ID`,
`OAUTH_REDIRECT_URIS`, `AUTH_SECRET`, and `SESSION_SECRET`, then disable the bypass flags.

## Production

Production requires:

- `OAUTH_ISSUER`
- `AUTH_SECRET`
- `SESSION_SECRET`
- `AUTH_ALLOWED_EMAILS`
- `OAUTH_REDIRECT_URIS`
- a real OTP mailer such as Resend

The API and MCP adapter accept OAuth access tokens. Daily stores a signed, httpOnly
session cookie and refreshes access tokens when they approach expiration. The
`AUTH_SECRET` signs and validates bearer tokens; `SESSION_SECRET` signs Daily's browser
session. Keep them separate and use different values for Preview and Production.

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

## OAuth redirect checklist

The registered redirect URI must exactly match `${APP_URL}/auth/callback`. Use the
deployment's own URL for Preview and Production. Do not use a Preview callback for
Production or share a database between the two environments.
