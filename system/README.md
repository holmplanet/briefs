# @brief/system

Express REST backend. Serves Stitch data from Postgres (or in-memory when no DB is configured).

## Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/stitches` | List stitches |
| POST | `/api/v1/stitches` | Create stitch |
| PATCH | `/api/v1/stitches/:id` | Update stitch |

Types come from `@brief/shared`. Personal vertical logic lives in `src/personal/`.

```bash
npm run dev -w @brief/system
```
