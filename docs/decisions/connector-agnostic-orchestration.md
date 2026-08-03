# ADR: Connector-agnostic orchestration

**Status:** Accepted  
**Date:** 2026-08-03  
**Refs:** [#16](https://github.com/holmplanet/brief/issues/16)

## Context

v0 built first-party connectors (Google Calendar OAuth, Open-Meteo weather) that sync external data into Brief's Event Graph. That makes Brief a data integrator — holding OAuth tokens, coupling to specific providers, and duplicating MCPs users may already have in Cursor, Claude, or ChatGPT.

## Decision

**Brief orchestrates; users integrate.**

| Brief owns | Users own (via their MCPs/tools) |
|------------|----------------------------------|
| Tasks (brief-native inbox) | Calendar, email, GitHub, Linear, etc. |
| Brief generation (`brief_me`, `what_changed`) | Provider credentials and API access |
| Reasoning over the Event Graph | Fetching live data from external systems |
| Action proposals (approval-gated) | Executing writes in external systems |
| Graph protocols (task, event, edge shapes) | Choosing which tools to connect |

External context enters Brief through **`ingest_context`** — the agent calls the user's MCPs, normalizes results, and uploads a snapshot. Brief never OAuth's to a user's calendar.

## Consequences

### Keep

- Task protocol + brief-native tasks (`brief-tasks` connector)
- `ingest_context` MCP tool
- Reasoning engine + brief generator
- Action engine (draft-first; live writes via user's tools after approval)

### Park (removed)

- ~~`google-calendar` and `weather` first-party connectors~~ — removed; use user MCPs + `ingest_context`
- ~~Google OAuth routes~~ — removed with calendar connector

### Agent workflow

```
1. User: "Brief me"
2. Agent: calendar MCP → list today's events
3. Agent: ingest_context({ source: "cursor-google-calendar", nodes: [...] })
4. Agent: brief_me({ syncFirst: true })  // syncs Brief-owned tasks only
```

### `sync_connectors`

Deprecated for external data. Syncs **Brief-owned** connectors only (`brief-tasks`). Prefer `ingest_context` for everything else.

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| Brief hosts all connectors | OAuth custody, provider lock-in, duplicates user MCPs |
| No graph — reason over MCP calls inline | No persistence, no delta briefs, no cross-source edges |
| Full agent inside Brief server | Heavy; users already have an agent in Cursor/Claude |
