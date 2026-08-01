# v0 smoke test

Proves the Personal Pack loop without live Google or weather API credentials.

## Automated (CI)

```bash
npm test
# or only the smoke suite:
npm run test:smoke
```

`tests/smoke/v0-loop.test.ts` exercises:

1. **Fixture calendar sync** — mocked `google-calendar` connector writes an outdoor event
2. **Fixture weather sync** — mocked `weather` connector writes a severe period and `depends_on` edge
3. **Graph ingestion** — event, weather, and dependency edge are present in the Event Graph
4. **`brief_me`** — reasoning returns a weather conflict bullet for the outdoor event
5. **`what_changed`** — delta brief reports no new changes when the graph is unchanged
6. **MCP HTTP** — same flow through streamable HTTP at `/mcp` using the official MCP client SDK

Fixtures live in `tests/fixtures/smoke-connectors.ts`. Harness helpers live in `tests/harness/smoke-harness.ts`.

## Manual smoke test

Use this when validating OAuth, Postgres/Redis, and a real assistant connection.

### 1. Start the stack

```bash
npm run db:up
cp .env.example .env
```

Set in `.env`:

```bash
BRIEF_WEATHER_LATITUDE=35.7796
BRIEF_WEATHER_LONGITUDE=-78.6382
BRIEF_GOOGLE_CLIENT_ID=<your-client-id>
BRIEF_GOOGLE_CLIENT_SECRET=<your-client-secret>
```

```bash
npm install
npm run dev
```

Confirm health:

```bash
curl http://localhost:8000/health
```

### 2. Connect Google Calendar

Open in a browser (replace `userId` with a stable id you will pass to MCP tools):

```
http://localhost:8000/auth/google/start?userId=demo-user
```

Complete Google OAuth. You should land on a success page.

### 3. Call MCP tools

**Option A — MCP Inspector**

1. Install [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
2. Connect to `http://localhost:8000/mcp` (streamable HTTP)
3. Call `sync_connectors` with `{ "userId": "demo-user" }`
4. Call `brief_me` with `{ "userId": "demo-user", "kind": "on_demand" }`
5. Optionally call `what_changed` with `{ "userId": "demo-user" }`

**Option B — Plugin bundle**

Point your assistant at `plugin/.mcp.json` (local) or install the Codex plugin from `plugin/.codex-plugin/plugin.json`.

### 4. What to look for

| Step | Expected result |
|------|-----------------|
| `sync_connectors` | `reports` array with `google-calendar` and `weather`, each `ok: true` |
| `brief_me` | Bullets include upcoming events and/or weather conflicts for outdoor meetings |
| `what_changed` | Delta bullets after the first brief; “No new changes” if nothing changed |
| `get_context` | Graph nodes for your calendar events when passed a matching `topic` |

### 5. Conflict scenario (manual)

Schedule an **outdoor** calendar event during forecasted rain or storms in your configured location, then run `sync_connectors` → `brief_me`. You should see a bullet like:

> “Your outdoor meeting” overlaps Thunderstorm weather.

This matches the v0 acceptance example in [VISION.md](../VISION.md).

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Only `google-calendar` in sync reports | `BRIEF_WEATHER_LATITUDE` / `LONGITUDE` set and server restarted |
| Calendar sync fails | OAuth completed for the same `userId` passed to MCP tools |
| Empty brief bullets | Run `sync_connectors` first; confirm `/health` shows `connectors: 2` |
| MCP connection refused | Server running on `BRIEF_PORT` (default `8000`) |
