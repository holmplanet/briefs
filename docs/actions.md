# Action engine

Approval-gated actions for Holmplanet Brief. v0 is **draft-only** — no live writes to external systems.

## Flow

```
propose_action → user reviews → approve_action → draft executor runs → audit log
```

Nothing executes without explicit approval.

## MCP tools

| Tool | Purpose |
|------|---------|
| `propose_action` | Create a pending action for user review |
| `list_actions` | List proposals by user (optional `status` filter) |
| `approve_action` | Approve and execute a proposed action |

### Example: draft a weather reschedule

```json
// propose_action
{
  "userId": "demo-user",
  "actionType": "draft_reschedule",
  "summary": "Move outdoor standup due to thunderstorms",
  "payload": {
    "eventLabel": "Outdoor standup",
    "newStart": "2026-08-02T15:00:00.000Z",
    "newEnd": "2026-08-02T15:30:00.000Z",
    "reason": "Overlaps severe weather"
  }
}
```

```json
// approve_action
{
  "userId": "demo-user",
  "actionId": "<id-from-propose>"
}
```

Response includes `result.mode: "draft"` and a message confirming no calendar write occurred.

## v0 action types

| `actionType` | Behavior |
|--------------|----------|
| `draft_reply` | Returns a draft email body; does not send |
| `draft_reschedule` | Returns proposed new event times; does not update calendar |
| `draft_notify` | Returns a draft notification; does not deliver |
| `log_note` | Records an internal note draft |
| `*` (unknown) | Fallback draft preview; no external write |

## Persistence

- **In-memory** when `BRIEF_DATABASE_URL` is unset (tests/local)
- **Postgres** tables `action_proposals` and `action_audit_log` when database is configured

## Audit log

Every proposal records:

1. `proposed` — action created
2. `approved` — user approved
3. `executed` — draft executor completed
4. `failed` — executor error (action marked `failed`)

Retrieve audit entries via the `approve_action` response or programmatically through the action engine.

## Post-v0

Live write executors (Google Calendar update, email send, CRM update) will register alongside draft executors and still require `approve_action`.
