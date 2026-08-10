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

Set `BRIEFS_SYSTEM_URL` (default `http://localhost:8001`), `BRIEFS_EVE_USER_ID`, and
`BRIEFS_EVE_ACCESS_TOKEN` for tool calls. The access token should be a Briefs bearer token in
production; local development may use the explicit System dev bypass.

## Phase 1 tools

- `items_list` — list the authenticated user’s durable items
- `items_create` — create a durable item
- `brief_me` — produce an items-only daily brief from current System state

`brief_me` is deliberately a read-only composition tool for this first slice. Persisted brief
records and calendar/email connections come after the item loop is proven.
