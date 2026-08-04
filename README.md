# Holmplanet Briefs


**Stitches** are what you capture. **Briefs** are what AI synthesizes on `brief me`.

```
shared/              Stitch + Brief schemas — single source of truth
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
curl -H "X-Briefs-User-Id: demo" http://localhost:8000/api/v1/stitches
curl -H "X-Briefs-User-Id: demo" http://localhost:8000/api/v1/briefs
curl -X POST -H "X-Briefs-User-Id: demo" -H "Content-Type: application/json" \
  http://localhost:8000/api/v1/brief/generate -d '{"kind":"morning"}'
```

## Workspaces

| Package | Role |
|---------|------|
| `@briefs/shared` | Stitch + Brief Zod schemas + store interfaces |
| `@briefs/system` | REST API, Postgres stores, personal services |
| `@briefs/personal` | Personal client (re-exports shared; UI TBD) |
| `@briefs/livestock` | Placeholder |
| `@briefs/fishing` | Placeholder |

## Schema

See [stitch.txt](stitch.txt), [brief.txt](brief.txt), and `shared/src/`. Product model: [docs/decisions/units-and-briefs.md](docs/decisions/units-and-briefs.md).

## Docker

```bash
npm run docker:up
```

Postgres + `@briefs/system` on port 8000.
