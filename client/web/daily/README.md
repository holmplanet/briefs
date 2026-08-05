# @briefs/daily

**Briefs Daily** — the default Briefs web client for everyday use. Capture items, track status, and read the activity log.

Not a vertical (livestock, fishing) — this is the general-purpose daily driver.

## Dev

From repo root:

```bash
npm run dev:daily     # http://localhost:3000
npm run dev:system    # API — http://localhost:8000
npm run dev:docs      # SDK docs — http://localhost:3001
```

Create `client/web/daily/.env.local`:

```bash
NEXT_PUBLIC_BRIEFS_API_URL=http://localhost:8001
NEXT_PUBLIC_BRIEFS_USER_ID=demo
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — capture form and quick links |
| `/items` | All items |
| `/items/:id` | Detail, status, activity log |
