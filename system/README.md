# @brief/system

Express REST backend. Serves TaskNode data from Postgres (or in-memory when no DB is configured).

## Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/tasks` | List tasks |
| POST | `/api/v1/tasks` | Create task |
| PATCH | `/api/v1/tasks/:id` | Update task |

Types come from `@brief/shared`. Personal vertical logic lives in `src/personal/`.

```bash
npm run dev -w @brief/system
```
