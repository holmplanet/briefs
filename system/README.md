# @briefs/system

Express REST API for Holmplanet Briefs.

## Routes

- `GET /health`
- `GET/POST/PATCH /api/v1/stitches`
- `GET /api/v1/briefs`, `GET /api/v1/briefs/:id`
- `POST /api/v1/brief/generate`

Types come from `@briefs/shared`. Personal vertical logic lives in `src/personal/`.

```bash
npm run dev -w @briefs/system
```
