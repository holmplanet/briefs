# `@briefs/mcp`

MCP tools for the Briefs items spine. Ships with a standalone dev server in this repo — no changes to external repos required.

Auth and tool patterns follow the same shape as [mcp-oauth-stack](https://github.com/holmplanet/mcp-oauth-stack) (reference only).

## Tools

| Tool | Description |
|------|-------------|
| `items_list` | List items (`status` optional) |
| `items_get` | Get one item by `item_id` |
| `items_create` | Create item (`name`, optional `kind`, `description`, `status`) |
| `items_update` | Patch item fields / status / lifecycle |
| `items_list_activities` | Append-only activity log for an item |

All tools call `@briefs/system` with `X-Briefs-User-Id` from the authenticated MCP user (`auth.userId`).

## Local dev server

```bash
npm run dev:system   # API on :8001
npm run dev:mcp      # MCP on :3334/mcp (dev auth bypass)
```

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
| `BRIEFS_API_URL` | `http://localhost:8001` |
| `BRIEFS_MCP_PORT` | `3334` |
| `BRIEFS_DEV_USER_ID` | `demo` |
| `BRIEFS_MCP_DEV_SKIP_AUTH` | `true` in dev |

## Tool registration contract

`registerBriefsTools(server, deps)` expects the same `requireAccessToken` hook used in mcp-oauth-stack — useful if Briefs later hosts its own OAuth-backed MCP server. The tool implementations live entirely in this repo.

## Architecture

```
Cursor / Codex  ──MCP──►  @briefs/mcp (:3334/mcp)
                              │
                              │ items_* tools
                              ▼
                       @briefs/system (:8001)
                              ▲
Briefs Daily (:3000) ──session──┘  (read-only)
```

Daily sign-in uses OAuth 2.1 + PKCE against a configurable issuer (`BRIEFS_OAUTH_ISSUER`). mcp-oauth-stack documents one compatible deployment pattern — Briefs does not fork or patch that repo.
