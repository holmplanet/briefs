# Weather connector

> **Deprecated (legacy).** Use the user's weather MCP or agent fetch + [`ingest_context`](../ingest-context.md). Registers only when `BRIEF_LEGACY_CONNECTORS=true`.

Read-only Personal Pack connector using [Open-Meteo](https://open-meteo.com/) (no API key required).

## Why Open-Meteo

- Free forecast API for v0 development
- No API key in repo — coordinates come from environment variables
- Hourly precipitation probability + WMO weather codes

## Environment

```bash
BRIEF_WEATHER_LATITUDE=35.7796
BRIEF_WEATHER_LONGITUDE=-78.6382
BRIEF_WEATHER_LOOKAHEAD_DAYS=7
BRIEF_WEATHER_PRECIP_ALERT_THRESHOLD=50
```

## Behavior

1. Fetches hourly forecast for the configured coordinates
2. Creates `weather` graph nodes for periods above the precipitation alert threshold (or severe weather codes)
3. Links calendar `event` nodes to weather via `depends_on` edges when times overlap
4. Reasoning surfaces conflicts like: “Meeting overlaps Rain weather.”

## Sync order

Run **calendar before weather** (or use `sync_connectors`, which runs all registered connectors). Weather reads existing event nodes from the graph to build edges.
