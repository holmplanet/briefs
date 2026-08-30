# Briefs

<table>
  <tr>
    <td align="center" bgcolor="#0b0f16">
      <img src="./client/web/docs/public/briefs-project-image.png" alt="Briefs" width="360" />
    </td>
  </tr>
</table>

One shape for work. Whatever work means in your system.

Briefs gives people, agents, and applications a shared shape for tracking work.
A task, note, support issue, research lead, calendar event, or something your
product has not named yet can move through the same schema, API, and history.
The shape stays stable while the meaning stays yours.

It is schema-first by design: import the shared Zod contracts, send work through
the REST API or MCP, and build the client your users actually need. Briefs is
small enough to adopt without reorganizing your whole product, and flexible
enough to grow into one.


Briefs is public-source software. The public SDK docs are hosted at
`briefs.holmplanet.com`; databases, email delivery, and environment secrets are
not required to run the project locally.

**Branching:** trunk-based — `main` only. See [CONTRIBUTING.md](./CONTRIBUTING.md).
The public release history and deployment boundary are captured in the [public release checklist](./docs/public-release.md).

```
shared/              Item + Actor + Activity schemas — single source of truth
system/              Express REST API + Postgres stores
client/
  cli/               @briefs/cli — terminal client + smoke tests
  web/               human-facing apps and shared UI
  plugin/            assistant manifests (Cursor/Codex skills)
db/migrations/       Postgres schema
docker/              Dockerfile + compose
```

## Why Briefs

Most software turns work into islands. Tasks live in one model, research in
another, agent runs in a third, and every integration becomes a translation
project.

Briefs gives those things a common skeleton. Agents get predictable fields to
read and write. Applications get room to define their own kinds and workflows.
People get a durable record instead of a trail of half-finished conversations.

The trick is that an Item does not need to know what your business is. `kind`
can mean `task`, `note`, `issue`, `lead`, `appointment`, or a type you invent
tomorrow. Identity, ownership, lifecycle, timestamps, sources, and activity
history remain consistent around it.

That makes Briefs useful as a work spine: one shared shape at the center, with
many clients and domains growing around it.

The core flow is:

```text
natural-language request → MCP write → Item + Activity → REST API → reference or custom client
```

Use Briefs when you are building an assistant workflow, an agent-operated
process, or a custom application that needs shared work records without
inventing a new task model and activity log every time.

Start with the [developer walkthrough](https://briefs.holmplanet.com/walkthrough)
or inspect the [Briefs Daily reference client](./client/web/daily).

## Data model

Three primitives:

| Concept | Name | Role |
|---------|------|------|
| **Item** | `item` | Durable thing — created once, identity never changes |
| **Actor** | `actor` | Person or software that acted |
| **Activity** | `activity` | Append-only record of what happened to an item |

**Write path:** item projection updates and activity records happen together. Activity `result` uses structured deltas (`changes`) on update and a compact `created` payload on create.

**Item schema (v4)** — key fields: `name`, `kind`, `status`, `ownerActorId`, `lifecycle`, `occurredAt`, optional `source` for ingest dedupe (`system` + `externalId`).

## Prerequisites

- Node.js **22+**
- Docker (for Postgres and optional full stack)

## Quick start

```bash
npm ci
cp .env.example .env
npm run db:up
npm run dev:system    # API http://localhost:8001
npm run dev:daily     # Briefs Daily http://localhost:3000
npm run dev:docs      # SDK docs http://localhost:3001
```

```bash
curl http://localhost:8001/health

curl -H "X-Briefs-User-Id: demo" http://localhost:8001/api/v1/items

curl -H "X-Briefs-User-Id: demo" http://localhost:8001/api/v1/actors/me

curl -H "X-Briefs-User-Id: demo" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ship items API","kind":"task"}' \
  http://localhost:8001/api/v1/items

curl -H "X-Briefs-User-Id: demo" \
  http://localhost:8001/api/v1/items/<item-id>/activities
```

For a complete create-and-read example that does not require `jq` or another
dependency:

```bash
npm run example:rest
```

The example creates one local development item and prints the item together
with its activity history. Set `BRIEFS_API_URL` or `BRIEFS_USER_ID` to use
different local values. Production requests use OAuth bearer tokens instead
of the development identity header.

Use `npm ci` (lockfile-driven installs). See `.cursor/rules/npm-security.mdc` for dependency policy.

## API

| Resource | Path | Notes |
|----------|------|-------|
| Items | `GET/POST/PATCH /api/v1/items` | List, create, update |
| Activities | `GET /api/v1/items/:id/activities` | Append-only event log per item |
| Actors | `GET /api/v1/actors/me`, `GET /api/v1/actors/:id` | Person actors for auth users |

Auth: `X-Briefs-User-Id` header (falls back to `DEFAULT_USER_ID` in `.env`).

The header and development bypass are local-development conveniences only.
Production API, Daily, and MCP requests require OAuth bearer tokens. Production
OAuth also requires an explicit `AUTH_ALLOWED_EMAILS` allowlist.

Ingested items can pass `source: { "system": "github", "externalId": "issue-18" }` on create; the DB enforces uniqueness per user.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:system` | API with hot reload (`tsx watch`) |
| `npm run dev:daily` | Briefs Daily web client |
| `npm run dev:mcp` | Briefs MCP dev server (`:3334/mcp`) |
| `npm run briefs` | Briefs CLI (`@briefs/cli`) |
| `npm run briefs:smoke` | API smoke test via CLI |
| `npm run test` | System integration tests (vitest) |
| `npm run build` | Compile all workspaces |
| `npm run typecheck` | Typecheck all workspaces |
| `npm run db:up` / `db:down` | Postgres only |
| `npm run docker:up` / `docker:down` | Postgres + API image |

## Workspaces

| Package | Role |
|---------|------|
| `@briefs/shared` | Item + Actor + Activity Zod schemas |
| `@briefs/system` | REST API, Postgres stores, domain services |
| `@briefs/web-shared` | Shared web UI primitives and theme |
| `@briefs/docs` | SDK documentation site (Next.js) |
| `@briefs/daily` | Briefs Daily — default web client |
| `@briefs/cli` | Terminal client + smoke tests |
| `@briefs/mcp` | MCP tools + standalone dev server |

`client/plugin/` is not an npm workspace — static Cursor/Codex manifests and skills. See `client/plugin/README.md`.

## Schema

Source of truth: `shared/src/` (`@briefs/shared`).

| Entity | Shared | Migration | Table |
|--------|--------|-----------|-------|
| Actor | `shared/src/actor/` | `db/migrations/001_initial.sql` | `actors` |
| Activity | `shared/src/activity/` | `db/migrations/001_initial.sql` | `activities` |
| Item | `shared/src/item/` | `db/migrations/001_initial.sql` | `items` |

Schema exports use entity-first names: `itemSchema`, `itemCreateInputSchema`, `activityRecordInputSchema`.

## Docker

```bash
npm run docker:up
```

Postgres + `@briefs/system` on port 8001. The production image compiles `shared` and `system` with `tsc` and runs `node system/dist/index.js` (no Next.js, no `tsx` in runtime). See `docker/README.md` and `deploy/docker.production.env.example`.

## Production deployment

The reference self-hosted deployment uses three separate boundaries:

- **Pulumi** provisions the DigitalOcean droplet, firewall, backups, and host bootstrap. It does
  not manage DNS, application images, or runtime secrets.
- **Infisical** is the production secret source. `deploy.sh` fetches the required application
  secrets at deploy time and installs them as protected Docker secret files on the droplet.
- **Docker Compose** runs Postgres, System, MCP, Daily, and Caddy on the droplet. The application
  ports bind to loopback; Caddy is the public ingress.

For a normal application release, Pulumi is not required. Configure the ignored
`deploy/docker.production.env` runtime file and copy `deploy/.deploy.local.example` to the ignored
`deploy/.deploy.local` deploy-context file, then authenticate Infisical and run:

```bash
infisical login
npm run deploy
npm run remote:status
```

The deploy-context file contains only local host and Infisical project settings. It is never
committed or copied to the droplet. See [`docs/deploy.md`](./docs/deploy.md) for provisioning,
deployment, recovery, and smoke-check details, and [`infra/pulumi/README.md`](./infra/pulumi/README.md)
for the infrastructure stack.

## Package docs

- `shared/README.md` — schema layout and imports
- `system/README.md` — API layout
- `client/web/docs/README.md` — SDK docs dev
- `client/web/daily/README.md` — Briefs Daily dev
- `client/plugin/README.md` — assistant integration
- `docs/dogfood.md` — calendar-to-morning-brief dogfood runbook
- `docs/database.md` — provider-neutral PostgreSQL setup for local, hosted, and self-hosted use
- `docs/architecture.md` — system boundaries and request flow
- `docs/authentication.md` — local and production authentication behavior
- `docs/contributing.md` — contributor setup and verification checklist

## Public project boundary

You can run the complete stack locally or deploy it yourself. The public
repository does not include production credentials, hosted database access, or
any private deployment configuration. See [SECURITY.md](./SECURITY.md) before
deploying an internet-facing instance.
