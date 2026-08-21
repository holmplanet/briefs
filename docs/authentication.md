# Authentication

Briefs uses OAuth 2.1 with PKCE and email OTP for the hosted Daily and MCP flow.

## Local development

When `OAUTH_ISSUER` is unset outside production, Daily and the local API can use
the configured development user. This is intended only for local work.

```bash
npm run db:up
npm run dev:system
npm run dev:daily
npm run dev:mcp
```

## Production

Production requires:

- `OAUTH_ISSUER`
- `AUTH_SECRET`
- `SESSION_SECRET`
- `AUTH_ALLOWED_EMAILS`
- `OAUTH_REDIRECT_URIS`
- a real OTP mailer such as Resend

The API and MCP adapter accept OAuth access tokens. Development identity headers
and bypass flags are rejected in production. Daily stores a signed, httpOnly
session cookie and refreshes access tokens when they approach expiration.

## Email policy

`AUTH_ALLOWED_EMAILS` is a comma-separated list of normalized email addresses.
The production server fails to start when the list is missing or empty. A future
public-signup mode should be designed and enabled explicitly rather than inferred
from an empty configuration value.
