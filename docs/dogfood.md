# Briefs dogfood: calendar to morning brief

This runbook proves the connector-agnostic morning workflow without Eve:

`Calendar MCP → normalized events → Briefs ingest_context → Briefs brief_me → Daily`

## Prerequisites

- Node.js 22+
- Docker running Postgres, or a local Briefs API
- Briefs MCP connected in Cursor/Codex
- A calendar MCP connected in the same assistant session
- Your local timezone and calendar provider name

Start the local stack with:

```bash
npm run docker:up
```

The MCP endpoint is `http://localhost:3334/mcp` and Daily is `http://localhost:3000`.

## Morning workflow

1. Ask the calendar MCP for events from the start of today through the end of today in the user's timezone.
2. Normalize each event before sending it to Briefs:

   ```json
   {
     "externalId": "provider-stable-event-id",
     "kind": "event",
     "name": "Design review",
     "startsAt": "2026-08-13T14:00:00.000Z",
     "endsAt": "2026-08-13T15:00:00.000Z",
     "location": "Zoom",
     "outdoor": false,
     "htmlLink": "https://calendar.example/event/123"
   }
   ```

   Preserve the provider's stable event ID. Never invent or hash an ID.
3. Call `ingest_context` with a stable source namespace, for example `cursor-google-calendar`, and the normalized nodes.
4. Call `brief_me` with `{ "kind": "morning" }` only after ingestion succeeds.
5. Read the returned brief and verify that it includes active tasks and today's calendar events.
6. Open Daily and confirm that ingested events are visible as event items with their scheduled time and source identity.

If the same event is ingested again, the `source` plus `externalId` pair must return the existing item rather than create a duplicate.

## Expected result

- Calendar events are durable Briefs items with `kind: "event"`.
- Each event keeps its provider identity in `source.system` and `source.externalId`.
- `brief_me` creates a persisted morning brief whose `itemIds` include the active events and tasks.
- Daily shows the same durable items and their append-only activity history.

## Troubleshooting

- No calendar MCP: run `brief_me` for a Briefs-only summary and report that calendar context was unavailable.
- Duplicate events: verify the provider event ID and source namespace did not change between runs.
- Empty brief: call `items_list` to confirm ingestion succeeded before calling `brief_me`.
- Unauthorized MCP: reconnect the Briefs MCP endpoint and check its `/health` route.
