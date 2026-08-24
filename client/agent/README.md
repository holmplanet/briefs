# `@briefs/agent`

Eve is the agent layer above `@briefs/system`. It owns reasoning and conversation; the System
owns durable items, actors, activities, and authentication.

## Runtime

The current Eve release requires Node 24. This workspace is intentionally isolated from the root
Node 22 development services until the local runtime is upgraded.

```bash
npm run info -w @briefs/agent
npm run dev:agent
```

Set `SYSTEM_URL` (default `http://localhost:8001`), `EVE_USER_ID`, and
`EVE_ACCESS_TOKEN` for tool calls. The access token should be a Briefs bearer token in
production; local development may use the explicit System dev bypass.

## Phase 1 tools

- `items_list` — list the authenticated user’s durable items
- `items_create` — create a durable item
- `brief_me` — produce and persist an items-only daily brief from current System state

`brief_me` persists a compact brief record. Calendar and email connections come after the item
loop is proven.

Item content contract: use `name` for the short title and `description` for the Markdown-formatted
body that humans and agents should read. Use `context` for vertical or scope metadata, not for a
second body.
