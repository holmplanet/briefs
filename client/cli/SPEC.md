# `@briefs/cli` — Implementation Spec

Canonical research doc: `2nd-brain/knowledge/research/briefs-cli.md`

## Summary

Single repo-level CLI at `client/cli/` that exercises `@briefs/system` over HTTP. Built for local dev, CI, and coding agents. **Not** separate CLIs for Daily or docs — those are web apps tested via browser MCP / Playwright.

## Package

| | |
|---|---|
| Name | `@briefs/cli` |
| Binary | `briefs` |
| Path | `client/cli/` |

## Commands (v0)

```bash
briefs health
briefs items list [--status <status>]
briefs items get <id>
briefs items create --name <name> --kind <kind> [--description <text>]
briefs items update <id> [--status <status>] [--name <name>]
briefs items activities <id>
briefs actors me
briefs smoke [--keep] [--json]
```

Global flags: `--json`, `--api-url`, `--user-id`, `--quiet`

## Environment

| Variable | Default |
|----------|---------|
| `API_URL` | `http://localhost:8001` |
| `USER_ID` | `demo` |

## Layout

```
client/cli/
  package.json
  tsconfig.json
  README.md
  SPEC.md                 # this file
  src/
    index.ts              # bin entry
    client.ts             # fetch wrapper + config
    output.ts             # human vs --json
    commands/
      health.ts
      items.ts
      actors.ts
      smoke.ts
```

## Smoke sequence

1. `GET /health` — assert `service === "holmplanet-briefs"`
2. `GET /api/v1/actors/me`
3. `POST /api/v1/items` — create smoke task
4. `GET /api/v1/items/:id`
5. `GET /api/v1/items/:id/activities`
6. `GET /api/v1/items` — list contains item
7. Cleanup unless `--keep`

## Phases

| Phase | Scope |
|-------|-------|
| **0** | Scaffold + CRUD commands + root `npm run briefs` | **Done** |
| **1** | `smoke` + CI + SDK docs mention | **Done** (CI optional) |
| **2** | `briefs dev api\|daily\|docs\|stack` (optional) |

## Non-goals

- Postgres or in-process system imports
- Dependencies on `@briefs/daily` or `@briefs/docs`
- Replacing holmplanet-brief MCP (`:8000`)
