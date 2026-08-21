# @briefs/docs

SDK documentation for **Holmplanet Briefs** — API reference, schemas, quickstart, and guides for building clients.

Runs at **http://localhost:3001** (`npm run dev:docs`).

The docs link to the `@briefs/daily` source folder on GitHub by default. Set `NEXT_PUBLIC_DAILY_URL` when developing locally or deploying a hosted Daily instance.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Introduction — architecture, packages, write path |
| `/quickstart` | Install, env, first curl requests |
| `/api` | REST API reference with live base URL |
| `/schemas` | `@briefs/shared` imports and field guide |
| `/build` | How to ship a web client |

## Dev

```bash
npm run dev:docs      # http://localhost:3001
npm run dev:daily     # http://localhost:3000
npm run dev:system    # API
```

Optional `client/web/docs/.env.local`:

```bash
NEXT_PUBLIC_DAILY_URL=http://localhost:3000
```
