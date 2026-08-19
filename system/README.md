# @briefs/system

Express REST API — items, actors, and activities.

## Authentication

API requests in production require `Authorization: Bearer <token>`. Tokens are issued by the
local OAuth 2.1 + PKCE issuer at `/oauth` during development and are signed with
`AUTH_SECRET`. The development-only `API_DEV_BYPASS` permits the legacy
`X-Briefs-User-Id` header for local smoke tests; it is ignored when `APP_ENV=production`.

The local issuer accepts an email as a development identity stub. Email OTP delivery and durable
OAuth storage are now backed by the database. For production, configure
`OTP_MAILER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM`; the process fails
closed if those settings are missing. Local development defaults to a console mailer and supports
`DEV_OTP_CODE` for deterministic tests.

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
