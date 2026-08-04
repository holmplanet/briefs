# @briefs/core

Next.js web app for **base Briefs users** — stitches, briefs, and the `brief me` flow.

## Stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- shadcn/ui

## Dev

From repo root:

```bash
npm run dev:core    # http://localhost:3000
npm run dev:system  # http://localhost:8000 (API)
```

Set `NEXT_PUBLIC_BRIEFS_API_URL` in `client/web/core/.env.local` (defaults to `http://localhost:8000`).

Types from `@briefs/shared`.
