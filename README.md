# Holmplanet Briefs


**Stitches** are what you capture. **Briefs** are what AI synthesizes on `brief me`.

```
shared/              Stitch + Brief schemas — single source of truth
system/              Express REST backend
client/
  web/               human-facing vertical UIs
    personal/
    livestock/
    fishing/
  plugin/            assistant manifests (Cursor/Codex, skills)
db/migrations/       Postgres schema
```

## Product model

| Concept | Name | Who creates it | Purpose |
|---------|------|----------------|---------|
| Platform | **Briefs** | — | Product / repo |
| Atomic item | **stitch** | User (or ingest) | Durable item woven into the graph |
| Snapshot | **brief** | AI on `brief me` | Point-in-time intelligence rundown |

**Briefs** is the platform. A **brief** is the generated artifact. Stitches are the atoms — textile metaphor: stitches make the brief (garment + document).

### `brief me` flow

1. Load context — user's stitches + recent briefs (+ optional ingested context)
2. Reason — what changed, what matters, what conflicts
3. Write brief — headline, bullets; link related stitch IDs
4. Persist — store brief row
5. Return — API response to the client

Generator v0 synthesizes from open stitches (no LLM yet).

## Quick start

```bash
npm install
npm run db:up
cp .env.example .env
npm run dev:system
```

```bash
curl http://localhost:8000/health
curl -H "X-Briefs-User-Id: demo" http://localhost:8000/api/v1/stitches
curl -H "X-Briefs-User-Id: demo" http://localhost:8000/api/v1/briefs
curl -X POST -H "X-Briefs-User-Id: demo" -H "Content-Type: application/json" \
  http://localhost:8000/api/v1/brief/generate -d '{"kind":"morning"}'
```

## API

| Resource | Path | Notes |
|----------|------|-------|
| Stitches | `GET/POST/PATCH /api/v1/stitches` | CRUD |
| Briefs | `GET /api/v1/briefs`, `GET /api/v1/briefs/:id` | List + get |
| Brief me | `POST /api/v1/brief/generate` | Synthesize + persist |

Auth: `X-Briefs-User-Id` header (or `BRIEFS_DEFAULT_USER_ID` env).

## Workspaces

| Package | Role |
|---------|------|
| `@briefs/shared` | Stitch + Brief Zod schemas + store interfaces |
| `@briefs/system` | REST API, Postgres stores, domain services |
| `@briefs/personal` | Personal web client (re-exports shared; UI TBD) |
| `@briefs/livestock` | Livestock web client (placeholder) |
| `@briefs/fishing` | Fishing web client (placeholder) |

`client/plugin/` is not an npm workspace — Codex/Cursor assistant integration only.

## Schema

Source of truth: `shared/src/` (`@briefs/shared`).

| Entity | Shared | Migration | Table |
|--------|--------|-----------|-------|
| Stitch | `shared/src/stitch/` | `db/migrations/001_stitch_nodes.sql` | `stitch_nodes` |
| Brief | `shared/src/brief/` | `db/migrations/003_briefs.sql` | `briefs` |

## Docker

```bash
npm run docker:up
```

Postgres + `@briefs/system` on port 8000.
