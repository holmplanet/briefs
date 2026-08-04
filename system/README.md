# @briefs/system

Express REST API — items, actors, and activities.

## Layout

```
src/
  api/
    item/routes.ts         GET/POST/PATCH /api/v1/items
    actor/routes.ts        GET /api/v1/actors
    router.ts
  item/                    ItemService + stores
  actor/                   ActorService + stores
  activity/                ActivityService + stores
  bootstrap.ts
  index.ts
```

```bash
npm run dev -w @briefs/system
```
