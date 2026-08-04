# Holmplanet Brief

> Your AI coordinator. Connect your tools. Understand your day. Brief you on what matters.

Holmplanet Brief is a **standalone, backend-first** coordination platform. It builds a persistent **Event Graph** from your existing tools and generates intelligent briefs on demand — morning, travel, project, or whenever you say "Brief me."

AI assistants (ChatGPT, Claude, Cursor, Codex) reach Brief through a **hosted MCP server**. Plugin manifests wrap that server for discovery and install — the platform is not embedded inside any one assistant.

## Status

Early development. **Connector-agnostic orchestration** — Brief owns tasks and briefs; users bring their own MCPs for calendar, email, GitHub, etc. Vertical apps under `apps/` are placeholders.

## Docs

| Doc | Purpose |
|-----|---------|
| [VISION.md](VISION.md) | Product vision and principles |
| [docs/architecture.md](docs/architecture.md) | Monorepo layout and core components |
| [docs/plugin-compliance.md](docs/plugin-compliance.md) | ChatGPT/Codex + Claude integration rules |
| [docs/connectors/brief-tasks.md](docs/connectors/brief-tasks.md) | Brief-native task inbox + MCP tools |
| [docs/dogfood.md](docs/dogfood.md) | Daily brief workflow (Cursor + calendar MCP + `ingest_context`) |
| [docs/ingest-context.md](docs/ingest-context.md) | Agent-mediated context upload (`ingest_context`) |
| [docs/decisions/connector-agnostic-orchestration.md](docs/decisions/connector-agnostic-orchestration.md) | Why Brief orchestrates user MCPs instead of OAuth |
| [docs/smoke-test.md](docs/smoke-test.md) | Automated + manual v0 smoke test |
| [docs/actions.md](docs/actions.md) | Approval-gated action engine |
| [docs/trust.md](docs/trust.md) | Auth, isolation, and trust principles |
| [docs/deploy.md](docs/deploy.md) | Docker Compose deployment |
| [plugin/](plugin/) | Codex + Claude MCP plugin manifests |

Canonical spec (2nd brain): `Developer/2nd-brain/knowledge/research/holmplanet-brief-spec.md`

## Monorepo layout

```
brief/
├── src/                # core platform API + MCP (TypeScript)
├── web/                # Next.js task inbox + brief UI
├── plugin/             # MCP + assistant manifests
├── apps/               # vertical packs (fishing, livestock, …)
└── docs/
```

## Development

**Branching:** `dev` is the default integration branch. Create feature branches off `dev` (`feat/<issue>-<description>`) and open PRs into `dev`. `main` is production — only release and hotfix branches merge there.

```bash
git checkout dev
git pull origin dev
npm install
npm run db:up          # Postgres + Redis (optional but recommended)
cp .env.example .env
npm test
npm run test:smoke   # v0 end-to-end loop only
npm run dev          # API on host (port 8000)
```

**Web UI (Next.js):**

```bash
npm run db:up        # or npm run docker:up for API in Docker
npm run dev:web      # Next.js on port 3100
```

Open [http://localhost:3100](http://localhost:3100). The web app proxies `/api/v1` to the Brief API on port 8000. See [web/README.md](web/README.md).

**Docker (full stack):**

```bash
cp .env.example .env   # optional overrides
npm run docker:up      # postgres + redis + brief + web
curl http://localhost:8000/health
open http://localhost:3100
```

- API + MCP: `http://localhost:8000`
- Web UI: `http://localhost:3100`

See [docs/deploy.md](docs/deploy.md) for compose details.

### Cursor MCP (local dogfood)

1. Start the stack: `npm run docker:up`
2. Confirm: `curl http://localhost:8000/health`
3. Open this repo in Cursor — `.cursor/mcp.json` points at `http://localhost:8000/mcp`
4. **Customize** sidebar → enable **holmplanet-brief** and your **calendar MCP**
5. **New chat** → see [docs/dogfood.md](docs/dogfood.md) for the full morning routine

Quick prompt:

```
Brief me — fetch today's calendar via my calendar MCP, ingest_context, then brief_me with userId=carter.
```

Fixture-only (no calendar MCP): `npm run docker:up` then `npm run dogfood`

Auth is disabled locally (`BRIEF_MCP_AUTH_DISABLED=true`). See [docs/connectors/brief-tasks.md](docs/connectors/brief-tasks.md).

- Health: `GET http://localhost:8000/health`
- API: `http://localhost:8000/api/v1`
- Web: `http://localhost:3100` (Next.js dev — `npm run dev:web`)
- MCP: `http://localhost:8000/mcp` (streamable HTTP, stateless)
- Graph persistence: **Postgres** when `BRIEF_DATABASE_URL` is set; in-memory otherwise
- Snapshot cache: **Redis** when `BRIEF_REDIS_URL` is set

See [GitHub Issues](https://github.com/holmplanet/brief/issues) for backlog.

**Dogfood scripts** (Docker must be running: `npm run docker:up`):

```bash
npm run dogfood        # ingest fixture calendar/weather → brief_me
npm run dogfood:tasks  # create_task → brief_me
```

## Motto

Connect everything. Understand everything. Brief only what matters.
