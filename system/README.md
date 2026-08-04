# @briefs/system

Express REST API for Holmplanet Briefs.

## Layout

```
src/
  api/
    stitch/routes.ts       GET/POST/PATCH /api/v1/stitches
    brief/
      routes.ts            GET /api/v1/briefs
      generate-routes.ts   POST /api/v1/brief/generate
    router.ts
    middleware.ts
    errors.ts
  stitch/
    service.ts             StitchService
    store.ts               Postgres + memory stores
    index.ts
  brief/
    service.ts             BriefService
    store.ts               Postgres + memory stores
    generator.ts           v0 stitch-based synthesizer
    index.ts
  bootstrap.ts             wire stores + services
  config.ts
  db.ts
  index.ts                 createApp + startServer
```

Types come from `@briefs/shared` (or `@briefs/shared/stitch`, `@briefs/shared/brief`).

```bash
npm run dev -w @briefs/system
```
