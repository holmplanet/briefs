# Architecture

Repo-local architecture reference. Canonical spec: `2nd-brain/knowledge/research/holmplanet-brief-spec.md`.

## Design stance

- **Standalone platform, backend first** — Brief is a hosted Holmplanet service with its own API, auth, database, and workers.
- **MCP is the assistant interface** — ChatGPT, Claude, and Cursor call the same remote MCP server.
- **Plugin manifests are distribution** — `.codex-plugin/plugin.json` and Claude `.mcp.json` point at the hosted server; they do not contain business logic.
- **Personal Pack is the base** — every account gets personal connectors and reasoning. Vertical apps extend the engine.

## Monorepo layout

```
brief/
├── README.md
├── VISION.md
├── package.json
├── tsconfig.json
├── docs/
│   ├── architecture.md          # this file
│   ├── plugin-compliance.md
│   ├── actions.md
│   ├── trust.md
│   ├── deploy.md
│   ├── smoke-test.md
│   └── connectors/
├── db/migrations/
├── scripts/dogfood.ts
├── src/                         # CORE — TypeScript platform at repo root
│   ├── index.ts                 # HTTP + MCP server entrypoint
│   ├── config.ts
│   ├── graph/                   # Event Graph models + persistence
│   ├── connectors/              # connector framework + personal connectors
│   ├── reasoning/               # change detection, rules
│   ├── briefs/                  # brief templates + generator
│   ├── actions/                 # approval queue + execution (v0: draft executors)
│   ├── auth/                    # Google OAuth, MCP bearer tokens
│   ├── db/                      # Postgres + Redis clients
│   └── mcp/                     # MCP tool registration
├── plugin/
│   ├── .mcp.json
│   ├── skills/brief/
│   └── .codex-plugin/plugin.json
├── apps/                        # vertical packs only
│   ├── fishing/
│   └── livestock/
└── tests/
```

**Rule:** shared engine → `src/`. Industry-specific → `apps/<name>/`.

## Request flow

```
User → AI Assistant → MCP (remote HTTP) → src/mcp/
                                              ↓
                                    graph + reasoning + briefs
                                              ↓
                                         connectors → external APIs
```

## Core components

### Connectors

Read (default) and later write external systems. Personal Pack: calendar, email, weather.

- **`ReadOnlyConnector`** — base class; implement `fetch()` returning normalized nodes/edges
- **`ConnectorRegistry`** — register connectors by name without touching core engine code
- **`ConnectorRunner`** — syncs into the Event Graph and records per-user status metadata
- **Normalized payload** — `externalId`-based records mapped to stable graph node/edge IDs

### Event Graph

Persistent relationships between events, people, tasks, and dependencies. The moat — connectors are interchangeable; the graph is the product.

- **Postgres** — canonical graph storage (`graph_nodes`, `graph_edges`)
- **Redis** — optional snapshot cache for `getSnapshot` reads (invalidated on writes)
- **In-memory** — fallback when `BRIEF_DATABASE_URL` is unset (local/tests)

## Reasoning engine

Walks the graph to find conflicts, opportunities, delays, and forgotten items since the last sync.

- **`ReasoningRule`** — pluggable rule interface; vertical packs register additional rules
- **`ReasoningRuleRegistry`** — default v0 rules: weather conflicts, schedule conflicts, stale dependencies, upcoming events
- **`ChangeSet`** — structured insights with stable `id`s for delta diffing
- **`diffInsights`** — powers `what_changed` by comparing against the last brief's change set
- **Connector status** — `lastSyncAt` metadata attached to each change set via `connectorStatusStore`

### Brief generator

Produces Morning / Afternoon / Travel / Weekly / Project briefs from reasoning output.

### Action engine

`propose_action` → user approval → `approve_action` → execute. No silent writes.

- **`ActionEngine`** — proposal queue, approval gate, executor dispatch
- **`ActionExecutor`** — pluggable per `actionType`; v0 executors are draft-only
- **`action_proposals` + `action_audit_log`** — Postgres persistence when configured
- **`list_actions`** — retrieve pending or completed proposals for a user

See [docs/actions.md](actions.md).

### Trust and auth

See [docs/trust.md](trust.md). MCP bearer tokens are required in production (`BRIEF_ENV=production`). Local dev disables auth unless `BRIEF_MCP_AUTH_ENABLED=true`.

## Vertical apps (`apps/`)

Vertical packs register extra connectors, graph types, and rules into the core engine. They do not duplicate `src/`.

| App | Status | Domain |
|-----|--------|--------|
| `apps/fishing` | Placeholder | Charter ops: tides, waivers, fuel, customers |
| `apps/livestock` | Placeholder | Livestock / ag operations (TBD) |

## v0 scope

Shipped on `main` through `9589f25` (issues #1–#12, #15 closed).

- Personal Pack only — `apps/*` README placeholders only
- Google Calendar + weather connectors (read)
- MCP tools: `sync_connectors`, `brief_me`, `what_changed`, `get_context`, `propose_action`, `list_actions`, `approve_action`
- Remote streamable HTTP MCP at `/mcp` + plugin manifests (`plugin/.mcp.json`, Codex plugin, workflow skill)
- Draft-only action engine (approval gate; no live external writes)
- MCP bearer auth + per-user isolation (`docs/trust.md`)
- Docker Compose deployment (`docs/deploy.md`)
- Automated smoke test with fixture connectors (`npm run test:smoke`)

**Not yet proven:** live Google OAuth dogfood (real calendar + weather conflict via `scripts/dogfood.ts`). See post-v0 in canonical spec.
