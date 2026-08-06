# `@briefs/mcp`

MCP tools for the Briefs items spine. Registers on any MCP server that exposes the mcp-oauth-stack `ToolDeps` contract, or runs standalone for local dev.

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

## mcp-oauth-stack integration

In [mcp-oauth-stack](https://github.com/holmplanet/mcp-oauth-stack), register tools in `src/tools/index.ts`:

```typescript
import { registerBriefsTools } from "@briefs/mcp";

export function registerAllTools(server: McpServer, deps: ToolDeps): void {
  registerHello(server, deps);
  registerBriefsTools(server, deps, {
    apiUrl: process.env.BRIEFS_API_URL,
  });
}
```

Use workspace link or publish `@briefs/mcp` until the packages are wired together. Production MCP URL (`http://localhost:3333/mcp`) then serves OAuth + Briefs tools — the same identity Briefs Daily uses.

## Architecture

```
Cursor / Codex  ──OAuth──►  mcp-oauth-stack (:3333/mcp)
                                │
                                │ items_* tools (@briefs/mcp)
                                ▼
                         @briefs/system (:8001)
                                ▲
Briefs Daily (:3000) ──session──┘  (read-only)
```
