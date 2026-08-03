---
name: brief
description: Use Holmplanet Brief MCP tools to ingest context, manage tasks, and generate intelligent daily briefs.
---

# Holmplanet Brief

Use the bundled `holmplanet-brief` MCP server. **Brief does not connect to the user's calendar or email** — you use their MCPs for that.

## Orchestration workflow

1. **Gather context** — call the user's MCP tools (calendar, GitHub, weather, Linear, etc.).
2. **Normalize** — map results to Brief graph shapes ([task protocol](https://github.com/holmplanet/brief/blob/dev/docs/graph/task-protocol.md), `event` nodes, edges).
3. **`ingest_context`** — upload nodes/edges with a stable `source` id (e.g. `cursor-google-calendar`, `github-issues`).
4. **`brief_me`** — generate the brief (`syncFirst: true` syncs Brief-owned tasks only).
5. **`what_changed`** — delta since the last brief.

## Brief-owned tools

| Tool | Use for |
|------|---------|
| `create_task` / `list_tasks` / `update_task` | Brief-native work items |
| `sync_connectors` | Sync Brief-owned data only (`brief-tasks`) |
| `propose_action` / `list_actions` / `approve_action` | Approval-gated recommendations |
| `get_context` | Inspect graph nodes for a topic |

## When to call what

- User says **"Brief me"** → gather via their MCPs → `ingest_context` → `brief_me`
- User asks **"What changed?"** → `what_changed` (ingest fresh context first if needed)
- User wants to **capture a task** → `create_task`
- User asks **what's on their plate** → `list_tasks` or `brief_me`
- User asks about a specific meeting → their calendar MCP, then `get_context` with a `topic`

## ingest_context example

```json
{
  "source": "cursor-google-calendar",
  "nodes": [
    {
      "externalId": "evt-1",
      "kind": "event",
      "label": "2 PM standup",
      "startsAt": "2026-08-05T18:00:00.000Z",
      "endsAt": "2026-08-05T18:30:00.000Z"
    }
  ],
  "edges": []
}
```

## Notes

- `userId` is optional when MCP auth binds the session.
- Local dev: `npm run dev` → `http://localhost:8000/mcp` (see `.cursor/mcp.json`).
