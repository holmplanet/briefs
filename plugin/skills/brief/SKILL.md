---
name: brief
description: Use Holmplanet Brief MCP tools to sync connectors and generate intelligent daily briefs.
---

# Holmplanet Brief

Use the bundled `holmplanet-brief` MCP server.

## Workflow

1. **`sync_connectors`** — sync registered connectors (brief-tasks, weather, calendar when configured) into the Event Graph.
2. **`brief_me`** — generate the current brief (morning, afternoon, or on-demand). Syncs connectors first by default.
3. **`what_changed`** — delta since the last brief.
4. **`get_context`** — fetch graph nodes for a topic when you need detail before proposing actions.
5. **`list_tasks` / `create_task` / `update_task`** — manage Brief-native tasks; writes sync to the graph automatically.
6. **`propose_action` / `list_actions` / `approve_action`** — recommend draft actions; execution requires explicit user approval.

## When to call what

- User says **"Brief me"** → `brief_me`
- User asks **"What changed?"** → `what_changed`
- User wants to **capture a task** → `create_task` (then `brief_me` if they want it in the brief)
- User asks **what's on their plate** → `list_tasks` with `status: "open"`, or `brief_me`
- User just connected calendar or data feels stale → `sync_connectors` then `brief_me`
- User asks about a specific meeting or person → `get_context` with a `topic`

## Notes

- `userId` is optional when MCP auth binds the session to a user; otherwise pass explicitly.
- Google Calendar OAuth: `/auth/google/start?userId=...` (when `BRIEF_GOOGLE_CLIENT_ID` is set).
- Weather requires `BRIEF_WEATHER_LATITUDE` and `BRIEF_WEATHER_LONGITUDE` on the Brief server.
- Local dev: `npm run dev` then use the bundled MCP at `http://localhost:8000/mcp` (see `.cursor/mcp.json`).
