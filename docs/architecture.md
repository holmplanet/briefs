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
├── pyproject.toml
├── docs/
│   ├── architecture.md          # this file
│   └── plugin-compliance.md
├── src/brief/                   # CORE — lives at repo root
│   ├── api/                     # HTTP: health, OAuth, webhooks
│   ├── connectors/              # connector framework + personal connectors
│   ├── graph/                   # Event Graph models + persistence
│   ├── reasoning/               # change detection, rules
│   ├── briefs/                  # brief templates + generator
│   ├── actions/                 # approval queue + execution
│   └── mcp/                     # MCP tool handlers
├── plugin/
│   ├── .mcp.json
│   └── .codex-plugin/plugin.json
├── apps/                        # vertical packs only
│   ├── fishing/
│   └── livestock/
└── tests/
```

**Rule:** shared engine → `src/brief/`. Industry-specific → `apps/<name>/`.

## Request flow

```
User → AI Assistant → MCP (remote HTTP) → src/brief/mcp/
                                              ↓
                                    graph + reasoning + briefs
                                              ↓
                                         connectors → external APIs
```

## Core components

### Connectors

Read (default) and later write external systems. Personal Pack: calendar, email, weather.

### Event Graph

Persistent relationships between events, people, tasks, and dependencies. The moat — connectors are interchangeable; the graph is the product.

### Reasoning engine

Walks the graph to find conflicts, opportunities, delays, and forgotten items since the last sync.

### Brief generator

Produces Morning / Afternoon / Travel / Weekly / Project briefs from reasoning output.

### Action engine

`propose_action` → user approval → `approve_action` → execute. No silent writes.

## Vertical apps (`apps/`)

Vertical packs register extra connectors, graph types, and rules into the core engine. They do not duplicate `src/brief/`.

| App | Status | Domain |
|-----|--------|--------|
| `apps/fishing` | Placeholder | Charter ops: tides, waivers, fuel, customers |
| `apps/livestock` | Placeholder | Livestock / ag operations (TBD) |

## v0 scope

- Personal Pack only
- Google Calendar + weather connectors (read)
- `brief_me`, `what_changed` MCP tools
- Remote MCP + plugin manifests
- No vertical app implementation
