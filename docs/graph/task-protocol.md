# Task protocol (v1)

Universal schema for `task` graph nodes. Connectors map external work items into this shape; reasoning and briefs read it without knowing the source system.

## Graph placement

| Field | Location | Notes |
|-------|----------|-------|
| `kind` | `graph_nodes.kind` | Always `task` |
| `label` | `graph_nodes.label` | Human-readable title |
| `startsAt` | `graph_nodes.starts_at` | Optional scheduled start |
| `endsAt` | `graph_nodes.ends_at` | Optional; mirrors `dueAt` when set |
| Protocol fields | `graph_nodes.data` | See below |
| `connector`, `externalId` | `graph_nodes.data` | Added by `mapPayloadToGraph` on sync |

## Protocol fields (`data`)

```json
{
  "schemaVersion": 1,
  "status": "open",
  "dueAt": "2026-08-05T17:00:00.000Z",
  "completedAt": null,
  "priority": "normal"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schemaVersion` | `1` | yes | Protocol version |
| `status` | `open` \| `in_progress` \| `done` \| `cancelled` | yes | Lifecycle state |
| `dueAt` | ISO-8601 | no | Due datetime |
| `completedAt` | ISO-8601 | no | When marked done |
| `priority` | `low` \| `normal` \| `high` \| `urgent` | no | Relative urgency |

Provider metadata (not part of strict protocol validation):

| Field | Description |
|-------|-------------|
| `source` | Provider id, e.g. `github-issues`, `linear`, `brief` |
| `description` | Longer body text |
| `url` | Link back to the source record |

## Edges

| Kind | Direction | Meaning |
|------|-----------|---------|
| `blocked_by` | source → target | Source cannot proceed until target is resolved |
| `waiting_on` | source → target | Source is waiting for target (person, task, event) |
| `depends_on` | source → target | Source requires target first |

## TypeScript API

```typescript
import { buildTaskNode, buildTaskEdge, asTaskNode } from "../src/graph/tasks/index.js";

const node = buildTaskNode({
  externalId: "brief-42",
  label: "Ship task protocol",
  dueAt: "2026-08-05T17:00:00.000Z",
  source: "brief",
});

const edge = buildTaskEdge({
  externalId: "dep-1",
  kind: EdgeKind.BLOCKED_BY,
  sourceExternalId: "brief-42",
  targetExternalId: "approval-7",
});
```

Use `asTaskNode(graphNode)` to parse a stored node back into typed protocol fields.

## Versioning

- Bump `schemaVersion` for breaking changes to required fields or enums.
- Add optional fields in-place within the same version when possible.
- Connectors should default missing `status` to `open` on read.
