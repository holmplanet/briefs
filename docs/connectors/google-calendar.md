# Google Calendar connector

Read-only Personal Pack connector for upcoming Google Calendar events.

## OAuth scopes (v0)

- `https://www.googleapis.com/auth/calendar.readonly`

## Environment

```bash
BRIEF_GOOGLE_CLIENT_ID=...
BRIEF_GOOGLE_CLIENT_SECRET=...
BRIEF_GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
BRIEF_GOOGLE_CALENDAR_LOOKAHEAD_DAYS=14
```

Tokens are stored in Postgres (`oauth_tokens`) when `BRIEF_DATABASE_URL` is set, otherwise in-memory for local dev/tests. **Never commit tokens or client secrets.**

## Connect flow

1. Start OAuth: `GET /auth/google/start?userId=<user-id>`
2. Complete Google consent → callback stores tokens
3. Sync: `getConnectorRegistry().sync(userId, "google-calendar")`

## Read-only guarantee

The connector only calls Calendar `events.list` on the primary calendar. No create/update/delete APIs are used in v0.
