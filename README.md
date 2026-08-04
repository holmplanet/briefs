# Holmplanet Brief

Schema-first task platform. npm workspaces monorepo (modeled after [bartonmalow/fort](https://github.com/bartonmalow/fort)).

```
shared/              TaskNode schema + types — single source of truth
system/              Express REST backend
client/
  personal/          personal client (UI placeholder)
  livestock/         placeholder
  fishing/           placeholder
plugin/              assistant manifests (unchanged)
db/migrations/       Postgres schema
```

## Quick start

```bash
npm install
npm run db:up
cp .env.example .env
npm run dev:system
```

```bash
curl http://localhost:8000/health
curl -H "X-Brief-User-Id: demo" http://localhost:8000/api/v1/tasks
```

## Workspaces

| Package | Role |
|---------|------|
| `@brief/shared` | TaskNode Zod schema + `TaskNodeStore` interface |
| `@brief/system` | REST API, Postgres store, personal service |
| `@brief/personal` | Personal client (re-exports shared; UI TBD) |
| `@brief/livestock` | Placeholder |
| `@brief/fishing` | Placeholder |

## Schema

See [tasknode.txt](tasknode.txt) and `shared/src/task-node.ts`.

## Docker

```bash
npm run docker:up
```

Postgres + `@brief/system` on port 8000.
