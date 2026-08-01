# Holmplanet Brief

> Your AI coordinator. Connect your tools. Understand your day. Brief you on what matters.

Holmplanet Brief is a **standalone, backend-first** coordination platform. It builds a persistent **Event Graph** from your existing tools and generates intelligent briefs on demand — morning, travel, project, or whenever you say "Brief me."

AI assistants (ChatGPT, Claude, Cursor, Codex) reach Brief through a **hosted MCP server**. Plugin manifests wrap that server for discovery and install — the platform is not embedded inside any one assistant.

## Status

Early development. **Personal Pack** first (calendar, weather, tasks). Vertical apps under `apps/` are placeholders.

## Docs

| Doc | Purpose |
|-----|---------|
| [VISION.md](VISION.md) | Product vision and principles |
| [docs/architecture.md](docs/architecture.md) | Monorepo layout and core components |
| [docs/plugin-compliance.md](docs/plugin-compliance.md) | ChatGPT/Codex + Claude integration rules |

Canonical spec (2nd brain): `Developer/2nd-brain/knowledge/research/holmplanet-brief-spec.md`

## Monorepo layout

```
brief/
├── src/                # core platform (TypeScript — repo root, not under apps/)
├── plugin/             # MCP + assistant manifests
├── apps/               # vertical packs (fishing, livestock, …)
└── docs/
```

## Development

```bash
npm install
npm test
npm run dev
```

- Health: `GET http://localhost:8000/health`
- MCP: `http://localhost:8000/mcp` (streamable HTTP, stateless)

See [GitHub Issues](https://github.com/holmplanet/brief/issues) for v0 backlog.

## Motto

Connect everything. Understand everything. Brief only what matters.
