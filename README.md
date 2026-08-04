# Holmplanet Brief

Barebones backend API. Schema-first task nodes for the **personal** client.

```
brief/
├── client/
│   ├── personal/     # TaskNode schema + store + service (active)
│   ├── livestock/    # placeholder
│   └── fishing/      # placeholder
├── src/              # Express API
├── db/migrations/    # Postgres schema
└── plugin/           # untouched — assistant manifests
```

## Quick start

```bash
npm install
npm run db:up
cp .env.example .env
npm run dev
```

```bash
curl http://localhost:8000/health
curl -H "X-Brief-User-Id: demo" http://localhost:8000/api/v1/tasks
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/tasks` | List tasks (`?status=open`) |
| POST | `/api/v1/tasks` | Create task |
| PATCH | `/api/v1/tasks/:id` | Update task |

Pass `X-Brief-User-Id` header to scope tasks to a user (defaults to `default`).

## Schema

See [tasknode.txt](tasknode.txt) and `client/personal/schema/task-node.ts`.

## Docker

```bash
npm run docker:up
```

Postgres + API on port 8000.
