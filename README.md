# Holmplanet Briefs

Schema-first platform for durable **items**, **actors**, and **activities**.


```
shared/              Item + Actor + Activity schemas — single source of truth
system/              Express REST backend
client/
  web/               human-facing vertical UIs
  plugin/            assistant manifests (Cursor/Codex, skills)
db/migrations/       Postgres schema
docker/              Dockerfile + compose
```

## Data model

Three primitives:

| Concept | Name | Role |
|---------|------|------|
| Item | **item** | Durable thing — created once, identity never changes |
| **Actor** | **actor** | Person or software that acted |
| **Activity** | **activity** | Append-only record of what happened to an item |

**Write path:** item projection updates and activity records happen together. Activity `result` uses structured deltas (`changes`) on update and a compact `created` payload on create.

## Quick start

```bash
npm install
npm run db:up
cp .env.example .env
npm run dev:system
npm run dev:core    # http://localhost:3000
```

```bash
curl http://localhost:8000/health
curl -H "X-Briefs-User-Id: demo" http://localhost:8000/api/v1/items
curl -H "X-Briefs-User-Id: demo" http://localhost:8000/api/v1/actors/me
curl -H "X-Briefs-User-Id: demo" http://localhost:8000/api/v1/items/<item-id>/activities
```

## API

| Resource | Path | Notes |
|----------|------|-------|
| Items | `GET/POST/PATCH /api/v1/items` | Item CRUD |
| Activities | `GET /api/v1/items/:id/activities` | Append-only event log per item |
| Actors | `GET /api/v1/actors/me`, `GET /api/v1/actors/:id` | Person actors for auth users |

Auth: `X-Briefs-User-Id` header (or `BRIEFS_DEFAULT_USER_ID` env).

## Workspaces

| Package | Role |
|---------|------|
| `@briefs/shared` | Item + Actor + Activity schemas |
| `@briefs/system` | REST API, Postgres stores, domain services |
| `@briefs/core` | Base web client (Next.js + shadcn) |
| `@briefs/livestock` | Livestock web client (placeholder) |
| `@briefs/fishing` | Fishing web client (placeholder) |

## Schema

Source of truth: `shared/src/` (`@briefs/shared`).

| Entity | Shared | Migration | Table |
|--------|--------|-----------|-------|
| Actor | `shared/src/actor/` | `db/migrations/001_initial.sql` | `actors` |
| Activity | `shared/src/activity/` | `db/migrations/001_initial.sql` | `activities` |
| Item | `shared/src/item/` | `db/migrations/001_initial.sql` | `items` |

## Docker

```bash
npm run docker:up
```

Postgres + `@briefs/system` on port 8000. See `docker/README.md`.
