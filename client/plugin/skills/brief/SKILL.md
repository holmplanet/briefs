---
name: brief
description: Use Holmplanet Brief MCP tools to ingest context, manage tasks, and generate intelligent daily briefs.
---

# Holmplanet Brief

Use the bundled `holmplanet-brief` MCP server. **Brief does not connect to the user's calendar or email** — you use their MCPs for that.

## Daily brief (do this when user says "Brief me")

Execute these steps **in order**. Do not call `brief_me` until context is ingested.

### 1. Fetch calendar

Call the user's **calendar MCP** (Google Calendar, Outlook, etc.) for events from **start of today** through **end of today** (or next 24h). Use the user's timezone when interpreting "today".

If no calendar MCP is available, say so and offer Brief-only brief (`list_tasks` / `brief_me` with tasks only).

### 2. Map events → normalized nodes

For each event, build a node for `ingest_context`:

```json
{
  "externalId": "<provider-event-id>",
  "kind": "event",
  "label": "<title>",
  "startsAt": "<ISO-8601 UTC>",
  "endsAt": "<ISO-8601 UTC>",
  "data": {
    "location": "<optional>",
    "outdoor": true,
    "htmlLink": "<optional>"
  }
}
```

| Field | Rule |
|-------|------|
| `externalId` | Provider's stable event id — never invent or hash |
| `outdoor` | `true` if title/location suggests outdoor (yard, park, golf, patio, hike, etc.) |
| `source` (on ingest call) | `"cursor-google-calendar"` or `"cursor-<provider>-calendar"` |

### 3. `ingest_context`

```json
{
  "userId": "carter",
  "source": "cursor-google-calendar",
  "nodes": [ "...mapped events..." ],
  "edges": []
}
```

Omit `userId` only when MCP auth binds the session. For local dogfood, always pass `"userId": "carter"` unless the user specifies another id.

### 4. Optional — weather for outdoor events

If the user has a weather MCP and any events are outdoor:

1. Fetch forecast overlapping those event times.
2. Ingest `kind: "weather"` nodes for severe or high-precip periods.
3. Add `depends_on` edges: `sourceExternalId` = event id, `targetExternalId` = weather period id.

Skip if no weather MCP — calendar + tasks still work.

### 5. `brief_me`

```json
{
  "userId": "carter",
  "kind": "morning",
  "syncFirst": true
}
```

Use `"kind": "on_demand"` for non-morning requests. **`syncFirst: true`** syncs Brief-owned tasks before reasoning.

### 6. Present the brief

Show the greeting and bullets (priority order). Call out overdue tasks, upcoming meetings, and weather conflicts. Offer `what_changed` if the user wants a delta.

---

## Other workflows

| Trigger | Steps |
|---------|-------|
| **"What changed?"** | Re-ingest fresh calendar if needed → `what_changed` |
| **"Add a task"** | `create_task` → optionally `brief_me` |
| **"What's on my plate?"** | `list_tasks` or `brief_me({ syncFirst: true })` |
| **Specific meeting** | Calendar MCP → `get_context` with `topic` |

## Brief-owned tools

| Tool | Use for |
|------|---------|
| `ingest_context` | Upload calendar, weather, GitHub, etc. from user's MCPs |
| `create_task` / `list_tasks` / `update_task` | Brief-native work items |
| `sync_connectors` | Sync Brief-owned data only (`brief-tasks`) |
| `brief_me` | Generate brief after ingest |
| `what_changed` | Delta since last brief |
| `get_context` | Inspect graph for a topic |
| `propose_action` / `list_actions` / `approve_action` | Approval-gated recommendations |

## Task nodes (GitHub, Linear, etc.)

Use `kind: "task"` with [task protocol v1](https://github.com/holmplanet/brief/blob/dev/docs/graph/task-protocol.md):

```json
{
  "externalId": "gh-42",
  "kind": "task",
  "label": "Review PR",
  "data": {
    "schemaVersion": 1,
    "status": "open",
    "dueAt": "2026-08-05T17:00:00.000Z",
    "priority": "high"
  }
}
```

## Notes

- **Docker (recommended):** `npm run docker:up` → `http://localhost:8000/mcp` (see `.cursor/mcp.json`).
- **Hybrid dev:** `npm run db:up && npm run dev` for hot reload on the host.
- Full runbook: [docs/dogfood.md](https://github.com/holmplanet/brief/blob/dev/docs/dogfood.md).
- Re-ingesting the same `source` + `externalId` updates graph nodes in place.
