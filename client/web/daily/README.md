# @briefs/daily

**Briefs Daily** — read-focused dashboard for your Briefs items. Sign in with OAuth; create and update items through `@briefs/mcp`. The `/briefs/new` Questionnaire is the one deliberate human-intake exception and uses the same System item/activity contract.

Daily auth follows the same OAuth 2.1 + PKCE + OTP patterns documented in [mcp-oauth-stack](https://github.com/holmplanet/mcp-oauth-stack) (reference only — Briefs does not modify that repo).

## Dev

From repo root:

```bash
npm run dev:daily     # http://localhost:3000
npm run dev:system    # API — http://localhost:8001
npm run dev:mcp       # MCP — http://localhost:3334/mcp
npm run test -w @briefs/daily # intake contract tests
npm run dev:docs      # SDK docs — http://localhost:3001
```

Create `client/web/daily/.env.local` from `.env.example`.

Without `BRIEFS_OAUTH_ISSUER`, development uses a dev user bypass (`BRIEFS_DEV_USER_ID`, default `demo`).

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
| `BRIEFS_OAUTH_ISSUER` | OAuth issuer URL (any OIDC-compatible provider) |
| `BRIEFS_OAUTH_CLIENT_ID` | OAuth client id |
| `BRIEFS_SESSION_SECRET` | HMAC session cookie signing |
| `BRIEFS_APP_URL` | Daily origin for OAuth redirect |

API requests use `X-Briefs-User-Id` from the signed session — the same user id MCP tools use when authenticated.
