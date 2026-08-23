# @briefs/docs

SDK documentation for **Holmplanet Briefs** — API reference, schemas, quickstart, and guides for building clients.

Runs at **http://localhost:3001** (`npm run dev:docs`).

For the daily-driver app, see `@briefs/daily` at http://localhost:3000.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Introduction — architecture, packages, write path |
| `/quickstart` | Install, env, first curl requests |
| `/api` | REST API reference with live base URL |
| `/schemas` | `@briefs/shared` imports and field guide |
| `/build` | How to ship a vertical web client |

## Dev

```bash
npm run dev:docs      # http://localhost:3001
npm run dev:daily     # http://localhost:3000
npm run dev:system    # API
```

Optional `client/web/docs/.env.local`:

```bash
NEXT_PUBLIC_DAILY_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

Production should set `NEXT_PUBLIC_SITE_URL=https://briefs.holmplanet.com`.
`NEXT_PUBLIC_DAILY_URL` is optional and only enables a local or separately
hosted Briefs Daily link; the public SDK docs do not depend on a live Daily
deployment.
