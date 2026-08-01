---
name: brief
description: Use Holmplanet Brief MCP tools to sync connectors and generate intelligent daily briefs.
---

# Holmplanet Brief

Use the bundled `holmplanet-brief` MCP server.

## Workflow

1. **`sync_connectors`** — after the user connects Google Calendar (`/auth/google/start?userId=...`), sync calendar + weather into the Event Graph.
2. **`brief_me`** — generate the current brief (morning, afternoon, or on-demand). Syncs connectors first by default.
3. **`what_changed`** — delta since the last brief.
4. **`get_context`** — fetch graph nodes for a topic when you need detail before proposing actions.
5. **`propose_action` / `approve_action`** — recommend actions; execution requires explicit user approval.

## When to call what

- User says **"Brief me"** → `brief_me`
- User asks **"What changed?"** → `what_changed`
- User just connected calendar or data feels stale → `sync_connectors` then `brief_me`
- User asks about a specific meeting or person → `get_context` with a `topic`

## Notes

- `userId` must match the id used during Google OAuth.
- Weather requires `BRIEF_WEATHER_LATITUDE` and `BRIEF_WEATHER_LONGITUDE` on the Brief server.
