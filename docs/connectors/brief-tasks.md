# Brief-native tasks connector

Built-in task inbox for Holmplanet Brief. Tasks are stored in Brief, synced into the Event Graph via the `brief-tasks` connector, and exposed through MCP tools.

## Storage

| Backend | When |
|---------|------|
| In-memory | `BRIEF_DATABASE_URL` unset (local/tests) |
| Postgres | `brief_tasks` table (`db/migrations/005_brief_tasks.sql`) |

## Connector

- **Name:** `brief-tasks`
- **Pack:** Personal
- **Source id:** `brief` (in graph node `data.source`)
- **Sync:** Included in `sync_connectors` / `brief_me` when `syncFirst` is true

Tasks map to graph nodes using [Task protocol v1](../graph/task-protocol.md).

## MCP tools

| Tool | Description |
|------|-------------|
| `list_tasks` | List tasks for the user; optional `status` filter |
| `create_task` | Create a task (`label`, optional `dueAt`, `scheduledAt`, `priority`, `description`) |
| `update_task` | Update fields by `taskId`; setting `status` to `done` auto-sets `completedAt` |

Writes sync to the graph immediately after each create/update.

## Example

```json
// create_task
{ "label": "Prep for standup", "dueAt": "2026-08-05T14:00:00.000Z", "priority": "high" }

// update_task
{ "taskId": "<uuid>", "status": "done" }
```

After sync, use `get_context` or `brief_me` to reason over tasks alongside calendar and weather nodes.
