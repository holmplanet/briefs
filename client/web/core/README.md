# @briefs/core

Next.js web app for **base Briefs users** — items, actors, and activities.

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

If port 8000 is already in use, start the API on another port and point the client at it:

```bash
BRIEFS_PORT=8001 npm run dev:system
```

Create `client/web/core/.env.local`:

```bash
NEXT_PUBLIC_BRIEFS_API_URL=http://localhost:8001
NEXT_PUBLIC_BRIEFS_USER_ID=demo
```

Types from `@briefs/shared`.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing + API health |
| `/items` | List and create items |
| `/items/:id` | Item detail, status updates, activity log |
