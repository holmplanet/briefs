# v0 smoke test

Proves the Personal Pack loop without live Google or weather API credentials.

## Automated (CI)

```bash
npm test
# or only the smoke suite:
npm run test:smoke
```

`tests/smoke/v0-loop.test.ts` exercises:

1. **Fixture context ingest** — `ingest_context` uploads a calendar event and weather period
2. **Graph ingestion** — event, weather, and `depends_on` edge are present in the Event Graph
3. **`brief_me`** — reasoning returns a weather conflict bullet for the outdoor event
4. **`what_changed`** — delta brief reports no new changes when the graph is unchanged
5. **MCP HTTP** — same flow through streamable HTTP at `/mcp` using the official MCP client SDK

Fixtures live in `tests/fixtures/smoke-connectors.ts` and `tests/fixtures/smoke-weather.ts`. Harness helpers live in `tests/harness/smoke-harness.ts`.

## Manual smoke test

Use this when validating Postgres/Redis and a real assistant connection.

### 1. Start the stack

```bash
npm run db:up
cp .env.example .env
npm install
npm run dev
```

Confirm health:

```bash
curl http://localhost:8000/health
```

### 2. Call MCP tools

**Option A — MCP Inspector**

1. Install [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
2. Connect to `http://localhost:8000/mcp` (streamable HTTP)
3. Call `ingest_context` with fixture nodes (see `tests/fixtures/smoke-connectors.ts`)
4. Call `brief_me` with `{ "userId": "demo-user", "kind": "on_demand" }`
5. Optionally call `what_changed` with `{ "userId": "demo-user" }`

**Option B — Plugin bundle**

Point your assistant at `plugin/.mcp.json` (local) or install the Codex plugin from `plugin/.codex-plugin/plugin.json`.

### 3. What to look for

| Step | Expected result |
|------|-----------------|
| `ingest_context` | `ok: true`, nodes/edges written to graph |
| `sync_connectors` | `reports` array with `brief-tasks`, `ok: true` |
| `brief_me` | Bullets include weather conflicts for outdoor events |
| `what_changed` | Delta bullets after the first brief; “No new changes” if nothing changed |
| `get_context` | Graph nodes for ingested events when passed a matching `topic` |

### 4. Conflict scenario (manual)

Ingest an **outdoor** calendar event linked to a severe weather period via `ingest_context`, then call `brief_me`. You should see a bullet like:

> “Your outdoor meeting” overlaps Thunderstorm weather.

This matches the v0 acceptance example in [VISION.md](../VISION.md).

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Empty brief bullets | Run `ingest_context` first; confirm `/health` shows connectors registered |
| MCP connection refused | Server running on `BRIEF_PORT` (default `8000`) |
| Graph empty after ingest | Same `userId` used across `ingest_context` and `brief_me` |
