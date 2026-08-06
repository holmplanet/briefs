# @briefs/daily

**Briefs Daily** — read-only dashboard for your Briefs items. Sign in with the same OAuth identity as your MCP client; create and update tasks through MCP, not the web UI.

Aligned with [mcp-oauth-stack](https://github.com/holmplanet/mcp-oauth-stack) (OAuth 2.1 + PKCE + OTP email).

## Dev

From repo root:

```bash
npm run dev:daily     # http://localhost:3000
npm run dev:system    # API — http://localhost:8001
npm run dev:docs      # SDK docs — http://localhost:3001
```

Create `client/web/daily/.env.local` from `.env.example`.

Without `BRIEFS_OAUTH_ISSUER`, development uses a dev user bypass (`BRIEFS_DEV_USER_ID`, default `demo`). Point `BRIEFS_OAUTH_ISSUER` at your mcp-oauth-stack URL to test real sign-in.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — open item counts, MCP overview |
| `/items` | Read-only item list |
| `/items/:id` | Detail + activity log |
| `/connect` | MCP setup for Cursor |
| `/login` | OAuth sign-in |

## Auth

| Variable | Purpose |
|----------|---------|
| `BRIEFS_OAUTH_ISSUER` | mcp-oauth-stack public URL |
| `BRIEFS_OAUTH_CLIENT_ID` | OAuth client id (register via DCR or config) |
| `BRIEFS_SESSION_SECRET` | HMAC session cookie signing |
| `BRIEFS_APP_URL` | Daily origin for OAuth redirect |

API requests use `X-Briefs-User-Id` from the signed session — the same user id MCP tools receive from bearer tokens.
