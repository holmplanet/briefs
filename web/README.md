# Brief Web

Next.js task inbox and brief viewer for the Holmplanet Brief platform.

## Development

Start the API first (port 8000), then the web app (port 3100):

```bash
# Terminal 1 — API (from repo root)
npm run docker:up   # or npm run dev

# Terminal 2 — Web
cd web
npm install
npm run dev
```

Open [http://localhost:3100](http://localhost:3100). For hybrid dev, the web app proxies `/api/v1` to the Brief API on port 8000.

### Docker

Included in the full stack — `npm run docker:up` from the repo root starts the `web` service on port **3100** (avoids Sous on :3000). The container proxies API calls to `http://brief:8000` on the compose network.

See [docs/deploy.md](../docs/deploy.md).

## Auth (local)

When MCP auth is disabled on the API, the web app sends `X-Brief-User-Id` (default `carter`). Change the user field in the UI to scope tasks.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server on :3100 |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run typecheck` | TypeScript check |

From repo root: `npm run dev:web`
