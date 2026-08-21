# `@briefs/mcp`

MCP tools for the Briefs items spine. Ships with a standalone dev server in this repo — no changes to external repos required.

The MCP adapter uses OAuth bearer tokens in production and an explicit development bypass only for local work.

## Tools

| Tool | Description |
|------|-------------|
| `items_list` | List items (`status` optional) |
| `items_get` | Get one item by `item_id` |
| `items_create` | Create item (`name`, optional `kind`, `description`, `status`) |
| `items_update` | Patch item fields / status / lifecycle |
| `items_list_activities` | Append-only activity log for an item |
| `ingest_context` | Ingest normalized external nodes with source-based deduplication |
| `brief_me` | Persist a summary of active tasks and ingested context |

All tools call `@briefs/system` with the authenticated user's bearer token. The identity header is
sent only as a development fallback and is ignored by the API in production.

## Local dev server

```bash
npm run dev:system   # API on :8001
  npm run dev:mcp      # MCP on :3334/mcp (configure bypass explicitly for local work)
npm run dev:daily     # Daily on :3000
npm run briefs:e2e-smoke # MCP → API → Daily smoke (archives its test item)
```

The smoke command expects all three local services to be running. Set
`E2E_KEEP=true` to keep the generated item for inspection.

```json
{
  "mcpServers": {
    "briefs": {
      "url": "http://localhost:3334/mcp"
    }
  }
}
```

| Variable | Default |
|----------|---------|
| `API_URL` | `http://localhost:8001` |
| `MCP_PORT` | `3334` |
| `DEV_USER_ID` | `demo` |
| `MCP_DEV_SKIP_AUTH` | `false` by default; set `true` only for local development |
| `OAUTH_ISSUER` | `http://localhost:8001/oauth` |
| `AUTH_SECRET` | `dev-briefs-auth-secret` |
| `API_DEV_BYPASS` | `true` outside production |
| `OTP_MAILER` | `console` locally; `resend` in production |
| `RESEND_API_KEY` | Required for Resend delivery |
| `EMAIL_FROM` | Verified sender address for Resend |

## Tool registration contract

`registerBriefsTools(server, deps)` receives a Briefs-owned `requireAccessToken` dependency so each tool can resolve the authenticated user before calling the System API. The tool implementations live entirely in this repo.

## Architecture

```
Cursor / Codex  ──MCP──►  @briefs/mcp (:3334/mcp)
                              │
                              │ items_*, ingest_context, brief_me
                              ▼
                       @briefs/system (:8001)
                              ▲
Briefs Daily (:3000) ──session──┘  (read-only)
```

Daily sign-in uses OAuth 2.1 + PKCE against a configurable issuer (`OAUTH_ISSUER`). The
system package now includes a local development issuer at `/oauth`; its email field is a local
identity stub, not production OTP delivery. Connect a real email provider before production.
Briefs owns this MCP adapter and its OAuth integration; no external repository is required to run it.
