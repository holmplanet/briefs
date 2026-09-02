# Briefs Flight spike

An isolated React/Vite surface for evaluating ThoughtPivot Flight alongside the current Next.js Daily app.

## Run

From this directory, with Redis available:

```sh
npm run dev
```

Flight owns the Node/Koa API process on port `3100` and starts Vite for the React UI in development. The health route is discovered from `src/flight.backend.ts`.

For a production-shaped local run, start Redis with `docker compose -f ../../../docker/docker-compose.yml up -d redis`, build the UI, then run `npm run start`. Flight serves the built `dist` directory and keeps the API and UI on the same port. Set `FLIGHT_MAX_WORKERS` explicitly in production; the local script defaults to two workers.

The `/api/flight/items` BFF route reuses Daily’s signed `briefs_daily_session` contract and forwards its bearer token server-side. The browser receives only the item response, never the token. Set `SESSION_SECRET` to the same value as Daily and `API_URL` to the Briefs API origin.
