# ingest_context

Agent-mediated upload of external context into the Event Graph. **Brief does not call calendar, email, or GitHub APIs** — the user's agent fetches data via their own MCPs and normalizes it here.

## When to use

| Tool | Use for |
|------|---------|
| **`ingest_context`** | Calendar events, GitHub issues, weather windows, CRM rows — anything from the user's MCPs |
| **`create_task` / `list_tasks`** | Brief-native work items (Brief-owned) |
| **`sync_connectors`** | Brief-owned connectors only (`brief-tasks`) |

## Workflow

```
1. Agent calls user's calendar MCP → events[]
2. Agent maps events to normalized nodes (see task-protocol / event shape)
3. Agent calls ingest_context({ source: "cursor-google-calendar", nodes, edges })
4. Agent calls brief_me({ syncFirst: true })
```

## Input

| Field | Required | Description |
|-------|----------|-------------|
| `source` | yes | Stable id for the upstream MCP/tool (e.g. `cursor-google-calendar`, `github-issues`) |
| `nodes` | no | Normalized graph nodes |
| `edges` | no | Relationships between nodes (by `externalId`) |
| `userId` | no | Defaults to authenticated user |

### Node shape

```json
{
  "externalId": "cal-event-abc123",
  "kind": "event",
  "label": "2 PM standup",
  "startsAt": "2026-08-05T18:00:00.000Z",
  "endsAt": "2026-08-05T18:30:00.000Z",
  "data": {
    "location": "Zoom"
  }
}
```

### Task nodes

Use `kind: "task"` with [task protocol v1](graph/task-protocol.md) fields in `data`:

```json
{
  "externalId": "gh-42",
  "kind": "task",
  "label": "Ship ingest_context",
  "endsAt": "2026-08-05T17:00:00.000Z",
  "data": {
    "schemaVersion": 1,
    "status": "open",
    "dueAt": "2026-08-05T17:00:00.000Z",
    "priority": "high"
  }
}
```

Re-ingesting the same `source` + `externalId` updates existing graph nodes (stable IDs).

## Output

```json
{
  "userId": "carter",
  "source": "cursor-google-calendar",
  "syncedAt": "2026-08-03T19:00:00.000Z",
  "nodesWritten": 5,
  "edgesWritten": 2
}
```

## See also

- [Daily brief dogfood runbook](dogfood.md) — Cursor + calendar MCP morning routine
- [ADR: Connector-agnostic orchestration](decisions/connector-agnostic-orchestration.md)
- [Task protocol v1](graph/task-protocol.md)
