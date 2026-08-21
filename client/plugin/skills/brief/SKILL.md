---
name: brief
description: Use Holmplanet Brief MCP tools to ingest context, manage tasks, and generate intelligent daily briefs.
---

# Holmplanet Brief

Use the bundled Briefs MCP server. **Briefs does not connect to the user's calendar or email** — you use their MCPs for that, then pass normalized context to Briefs.

## Daily brief (do this when user says "Brief me")

Execute these steps **in order**. Do not call `brief_me` until context is ingested.

### 1. Fetch calendar

Call the user's **calendar MCP** (Google Calendar, Outlook, etc.) for events from **start of today** through **end of today** (or next 24h). Use the user's timezone when interpreting "today".

If no calendar MCP is available, say so and offer a Brief-only summary (`items_list` / `brief_me` with tasks only).

### 2. Map events → normalized nodes

For each event, build a node for `ingest_context`:

```json
{
  "externalId": "<provider-event-id>",
  "kind": "event",
  "name": "<title>",
  "startsAt": "<ISO-8601 UTC>",
  "endsAt": "<ISO-8601 UTC>",
  "location": "<optional>",
  "outdoor": true,
  "htmlLink": "<optional>"
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
  "source": "cursor-google-calendar",
  "nodes": [ "...mapped events..." ]
}
```

The MCP session binds the user identity. Do not pass a user ID from the calendar payload.

### 4. Optional — weather for outdoor events

If the user has a weather MCP and any events are outdoor:

1. Fetch forecast overlapping those event times.
2. Ingest `kind: "weather"` nodes for severe or high-precip periods.
3. Add `depends_on` edges: `sourceExternalId` = event id, `targetExternalId` = weather period id.

Skip if no weather MCP — calendar + tasks still work.

### 5. `brief_me`

```json
{
  "kind": "morning"
}
```

Use `"kind": "on_demand"` for non-morning requests.

### 6. Present the brief

Show the greeting and bullets (priority order). Call out overdue tasks, upcoming meetings, and weather conflicts. Offer `what_changed` if the user wants a delta.

---

## Other workflows

| Trigger | Steps |
|---------|-------|
| **"What changed?"** | Re-ingest fresh calendar if needed → `items_list` / activity history |
| **"Add a task"** | `items_create` → optionally `brief_me` |
| **"What's on my plate?"** | `items_list` or `brief_me` |
| **Specific meeting** | Calendar MCP → `items_get` after ingestion |

## Brief-owned tools

| Tool | Use for |
|------|---------|
| `ingest_context` | Upload calendar, weather, GitHub, etc. from user's MCPs |
| `items_create` / `items_list` / `items_update` | Brief-native work items |
| `ingest_context` | Upload normalized calendar, weather, GitHub, or other context |
| `brief_me` | Generate brief after ingest |
| `items_list_activities` | Inspect the append-only history for an item |

## Items API (tasks, events, ingest)

Prefer `POST /api/v1/items` for durable work capture. Auth: `X-Briefs-User-Id` header.

Task from GitHub, Linear, etc.:

```json
{
  "name": "Review PR",
  "kind": "task",
  "status": "open",
  "dueAt": "2026-08-05T17:00:00.000Z",
  "priority": "high",
  "source": { "system": "github", "externalId": "gh-42" }
}
```

Calendar event (deduped by `source`):

```json
{
  "name": "Standup",
  "kind": "event",
  "occurredAt": "2026-08-04T09:00:00.000Z",
  "scheduledAt": "2026-08-04T09:30:00.000Z",
  "source": { "system": "google-calendar", "externalId": "evt-123" },
  "performer": {
    "kind": "Service",
    "identity": "cursor:brief-skill",
    "name": "Cursor Brief Skill"
  }
}
```

Item fields: `name`, `kind`, `status`, `lifecycle` (`active` | `archived`), `occurredAt`, `ownerActorId` (set by system), `context`, `source`, `ingestedAt`.

## Notes

- **Docker (recommended):** `npm run docker:up` → `http://localhost:3334/mcp` (see `.cursor/mcp.json`).
- **Hybrid dev:** `npm run db:up && npm run dev` for hot reload on the host.
- Full runbook: [docs/dogfood.md](https://github.com/holmplanet/briefs/blob/main/docs/dogfood.md) (when present).
- Re-ingesting the same `source` + `externalId` updates graph nodes in place.
