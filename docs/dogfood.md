# Daily brief dogfood (Cursor + real MCPs)

Prove the connector-agnostic loop: **your calendar MCP** fetches live data → **`ingest_context`** uploads it → **`brief_me`** generates the brief.

## Prerequisites

### 1. Brief server (Docker — recommended)

Run the full stack in Docker (Postgres + Redis + Brief). Cursor on your host still talks to `http://localhost:8000/mcp` via the published port.

```bash
npm run docker:up
curl http://localhost:8000/health
```

Expected: `"status": "ok"`, `"connectors": 1`, `"storage": { "graph": "postgres", "cache": "redis" }`.

Rebuild after code changes:

```bash
docker compose build brief && docker compose up -d brief
```

Logs: `npm run docker:logs` or `docker compose logs -f brief`

Stop: `npm run docker:down`

**Alternative (hybrid dev)** — databases in Docker, app on host with hot reload:

```bash
npm run db:up
cp .env.example .env   # BRIEF_DATABASE_URL + BRIEF_REDIS_URL for host
npm run dev
```

### 2. Cursor MCP
`.cursor/mcp.json` wires `holmplanet-brief` to `http://localhost:8000/mcp` (works with Docker or host). In Cursor: **Customize → MCP → enable holmplanet-brief**.

### 3. Calendar MCP

Any MCP that lists the user's events (Google Calendar, Outlook, etc.). Brief does not provide this; you bring your own.

### 4. Stable `userId`

Local Docker uses auth-disabled mode (`BRIEF_MCP_AUTH_DISABLED=true` in compose). Pass `"userId": "carter"` (or your chosen id) on every Brief tool call so graph data stays consistent.

## Morning routine (agent workflow)

When the user says **"Brief me"**, **"Morning brief"**, or similar:

### Step 1 — Fetch today's calendar

Call the user's **calendar MCP** for events in a sensible window:

- **Start:** beginning of today (user's timezone, default US Eastern if unknown)
- **End:** end of today, or next 24 hours for a fuller brief

Keep the raw response — you need stable event ids for re-ingest.

### Step 2 — Normalize to Brief `event` nodes

Map each calendar event to an `ingest_context` node:

| Brief field | Source (typical) |
|-------------|------------------|
| `externalId` | Provider event id (e.g. Google `id`, Outlook `id`) — **required, stable** |
| `kind` | `"event"` |
| `label` | Title / summary |
| `startsAt` | Start time as ISO 8601 UTC |
| `endsAt` | End time as ISO 8601 UTC |
| `data.location` | Location string, if any |
| `data.outdoor` | `true` if location or title suggests outdoor (park, golf, standup on the deck, etc.) |
| `data.htmlLink` | Provider web link, if available |

```json
{
  "externalId": "abc123xyz",
  "kind": "event",
  "label": "Outdoor standup",
  "startsAt": "2026-08-05T14:00:00.000Z",
  "endsAt": "2026-08-05T14:30:00.000Z",
  "data": {
    "location": "Back patio",
    "outdoor": true
  }
}
```

### Step 3 — `ingest_context`

```json
{
  "userId": "carter",
  "source": "cursor-google-calendar",
  "nodes": [ "...mapped events..." ],
  "edges": []
}
```

Use a stable `source` per upstream MCP. Re-running with the same `source` + `externalId` updates nodes in place.

### Step 4 — Optional: weather

If the user has a **weather MCP** and any events are outdoor:

1. Fetch forecast for event locations/times.
2. Ingest `kind: "weather"` nodes for severe or high-precip windows.
3. Add `depends_on` edges from event `externalId` → weather `externalId` when times overlap.

See `tests/fixtures/smoke-weather.ts` for node/edge shapes. Skip this step if no weather MCP — calendar + tasks still produce a useful brief.

### Step 5 — `brief_me`

```json
{
  "userId": "carter",
  "kind": "morning",
  "syncFirst": true
}
```

- `syncFirst: true` syncs **Brief-owned tasks** (`brief-tasks`) into the graph before reasoning.
- `kind: "morning"` sets the greeting; use `"on_demand"` for ad-hoc briefs.

Present bullets sorted by priority. Mention overdue/due-today tasks, upcoming events (next 24h), and weather conflicts if ingested.

### Step 6 — Optional follow-ups

| User says | Tool |
|-----------|------|
| "What changed since this morning?" | `what_changed` |
| "Add a task for …" | `create_task` |
| "What's on my plate?" | `list_tasks` or `brief_me` |

## Example prompts (Cursor chat)

```
Brief me — use my calendar MCP, ingest today's events, then brief_me.
```

```
Morning brief. userId=carter. Include overdue Brief tasks.
```

```
What changed since my last brief?
```

## What a good brief includes

With calendar + tasks ingested, reasoning should surface:

- **Overdue / due-today tasks** (from `brief-tasks`)
- **Upcoming events** in the next 24 hours
- **Weather conflicts** (only if weather nodes + `depends_on` edges were ingested)
- **Schedule overlaps** (if multiple events conflict)

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Empty brief | Run `ingest_context` first; confirm events have `startsAt` in the future or tasks exist |
| Graph resets between sessions | Use `npm run docker:up` (Postgres volume persists) — not `npm run dev` without `BRIEF_DATABASE_URL` |
| Docker brief won't start | `docker compose logs brief` — wait for postgres/redis healthchecks |
| Port 8000 in use | Set `BRIEF_PORT=8001` in `.env`, update `.cursor/mcp.json` URL |
| Wrong user's data | Use the same `userId` on every tool call |
| Calendar MCP not found | Enable the calendar MCP in Cursor; Brief cannot fetch calendar directly |
| No weather conflicts | Ingest weather + `depends_on` edges, or mark outdoor events with `data.outdoor: true` |
| `holmplanet-brief` tools missing | Server running? MCP enabled in Cursor? Check `/health` |

## Fixture dogfood (no calendar MCP)

With Docker running (`npm run docker:up`), smoke the MCP loop from your host:

```bash
npm run dogfood        # fixture calendar/weather → brief_me
npm run dogfood:tasks  # create_task → brief_me
```

Both scripts call `http://localhost:8000/mcp` — same endpoint Cursor uses.

See [smoke-test.md](smoke-test.md).

## See also

- [ingest-context.md](ingest-context.md) — node shapes and protocol
- [connectors/brief-tasks.md](connectors/brief-tasks.md) — Brief-native tasks
- [plugin/skills/brief/SKILL.md](../plugin/skills/brief/SKILL.md) — agent skill (install in Cursor)
