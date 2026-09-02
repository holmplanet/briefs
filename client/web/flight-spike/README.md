# Briefs Flight spike

An isolated React/Vite surface for evaluating ThoughtPivot Flight alongside the current Next.js Daily app.

## Run

From this directory, with Redis available:

```sh
npm run dev
```

Flight owns the Node/Koa API process on port `3100` and starts Vite for the React UI in development. The health route is discovered from `src/flight.backend.ts`.

This spike intentionally does not duplicate Better Auth. The next step is an authenticated BFF route that reuses Daily’s server-side session boundary, then a real `/items` read path.
