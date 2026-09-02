# Briefs SDK docs

SDK documentation for **Briefs** — the schema-first work spine for agents,
applications, and people building around the same durable records.

Runs at **http://localhost:3001** (`npm run dev:docs`).

The docs link to the `@briefs/flight-spike` source folder on GitHub by default. Set `NEXT_PUBLIC_DAILY_URL` when developing locally or deploying a hosted Daily instance.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Introduction — architecture, packages, write path |
| `/quickstart` | Install, env, first curl requests |
| `/daily` | Briefs Daily reference client, auth, and extension guide |
| `/walkthrough` | End-to-end request, MCP, API, and client walkthrough |
| `/api` | REST API reference with live base URL |
| `/schemas` | `@briefs/shared` imports and field guide |
| `/protocols` | MCP, OAuth, and Briefs-owned schema contracts |
| `/build` | How to ship a web client |

## Dev

```bash
npm run dev:docs      # http://localhost:3001
npm run dev:flight     # http://localhost:3000
npm run dev:system    # API
```

Optional `client/web/docs/.env.local`:

```bash
NEXT_PUBLIC_DAILY_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

Production should set `NEXT_PUBLIC_SITE_URL=https://briefs.holmplanet.com`.
`NEXT_PUBLIC_DAILY_URL` is optional; without it, the docs link to the Daily
source on GitHub so the SDK docs do not depend on a hosted Daily deployment.
