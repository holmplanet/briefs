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
| [docs/connectors/google-calendar.md](docs/connectors/google-calendar.md) | Google Calendar OAuth + sync |
| [docs/connectors/weather.md](docs/connectors/weather.md) | Weather forecast connector (Open-Meteo) |
| [docs/connectors/brief-tasks.md](docs/connectors/brief-tasks.md) | Brief-native task inbox + MCP tools |
| [docs/smoke-test.md](docs/smoke-test.md) | Automated + manual v0 smoke test |
| [docs/actions.md](docs/actions.md) | Approval-gated action engine |
| [docs/trust.md](docs/trust.md) | Auth, isolation, and trust principles |
| [docs/deploy.md](docs/deploy.md) | Docker Compose deployment |
| [plugin/](plugin/) | Codex + Claude MCP plugin manifests |

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
npm run db:up          # Postgres + Redis (optional but recommended)
cp .env.example .env
npm test
npm run test:smoke   # v0 end-to-end loop only
npm run dev
```

**Docker (full stack):**

```bash
cp .env.example .env   # optional overrides
npm run docker:up      # postgres + redis + brief container
curl http://localhost:8000/health
```

See [docs/deploy.md](docs/deploy.md) for compose details.

- Health: `GET http://localhost:8000/health`
- MCP: `http://localhost:8000/mcp` (streamable HTTP, stateless)
- Graph persistence: **Postgres** when `BRIEF_DATABASE_URL` is set; in-memory otherwise
- Snapshot cache: **Redis** when `BRIEF_REDIS_URL` is set

See [GitHub Issues](https://github.com/holmplanet/brief/issues) for v0 backlog.

## Motto

Connect everything. Understand everything. Brief only what matters.
