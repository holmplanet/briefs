# Holmplanet Brief

Schema-first coordination platform. npm workspaces monorepo (modeled after [bartonmalow/fort](https://github.com/bartonmalow/fort)).

**Stitches** are what you capture. **Briefs** are what AI synthesizes on `brief me`.

```
shared/              Stitch schema + types — single source of truth
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
curl -H "X-Brief-User-Id: demo" http://localhost:8000/api/v1/stitches
```

## Workspaces

| Package | Role |
|---------|------|
| `@brief/shared` | Stitch Zod schema + `StitchStore` interface |
| `@brief/system` | REST API, Postgres store, personal service |
| `@brief/personal` | Personal client (re-exports shared; UI TBD) |
| `@brief/livestock` | Placeholder |
| `@brief/fishing` | Placeholder |

## Schema

See [stitch.txt](stitch.txt) and `shared/src/stitch.ts`. Product model: [docs/decisions/units-and-briefs.md](docs/decisions/units-and-briefs.md).

## Docker

```bash
npm run docker:up
```

Postgres + `@brief/system` on port 8000.
