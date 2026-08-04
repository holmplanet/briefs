# Decision: Stitches + Briefs

**Status:** accepted  
**Date:** 2026-08-04  
**Context:** Barebones Brief overhaul (`hard-reset` branch). Product name is **Brief**. Brand may lean underwear (boxer briefs); naming should support that voice.

## The distinction (like tweet vs Twitter)

| Concept | Name | Who creates it | Purpose |
|---------|------|----------------|---------|
| Atomic captured item | **stitch** | User (or ingest) | Durable item woven into the graph |
| Synthesized rundown | **brief** | AI on `brief me` | Point-in-time intelligence snapshot |

**Brief** is the product *and* the generated artifact. **Stitches** are the atoms — textile metaphor: stitches make the brief (garment + document).

Brand lines this enables:
- "Fresh **briefs** every morning."
- "**Brief** me." / add a **stitch**.
- Stitches compose; briefs are what you put on.

## Flow

```
┌─────────────┐     CRUD      ┌──────────────────┐
│    User     │ ────────────► │  Stitches        │
│  (+ ingest) │               │  stitch_nodes    │
└─────────────┘               └────────┬─────────┘
                                       │
┌─────────────┐     read      ┌────────▼─────────┐
│  AI agent   │ ◄──────────── │  Past briefs     │
│  brief me   │               │  (history)       │
└──────┬──────┘               └──────────────────┘
       │
       │  synthesize + persist
       ▼
┌──────────────────┐
│  New brief       │ ──► returned to user
└──────────────────┘
```

### `brief me` sequence

1. **Load context** — user's stitches + recent briefs + optional ingested context.
2. **Reason** — what changed, what matters, what conflicts.
3. **Write brief** — headline, bullets, sections; link related stitch IDs.
4. **Persist** — store brief row (user, kind, `generatedAt`, payload).
5. **Return** — API response to the client.

### Why persist briefs

- AI gets **memory** across sessions.
- **Delta** — "since your last brief…"
- **User history** — browse past mornings, travel briefs, etc.

## Data model

### Stitches (`stitch_nodes`)

Implemented in `@brief/shared` + `@brief/system`.

Core fields: `id`, `userId`, `label`, `status`, `dueAt`, `priority`, `description`, timestamps.

API: `GET/POST/PATCH /api/v1/stitches`

### Briefs table (to implement)

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `user_id` | text | |
| `kind` | text | `morning`, `on_demand`, `travel`, … |
| `generated_at` | timestamptz | |
| `greeting` | text | optional |
| `headline` | text | optional |
| `payload` | jsonb | bullets, sections, insights |
| `related_stitch_ids` | text[] | stitches cited in this brief |
| `created_at` | timestamptz | |

## API surface (target)

| Resource | Path | Notes |
|----------|------|-------|
| Stitches | `/api/v1/stitches` | CRUD |
| Briefs | `/api/v1/briefs` | List + get |
| Brief me | `POST /api/v1/brief/generate` | Synthesize + persist |

## Open questions

- [ ] Implement `briefs` table + generator in `@brief/system`.
- [ ] Does ingest create stitches, brief sections, or both?
- [ ] Vertical extensions in `client/livestock`, `client/fishing`.

## References

- Schema reference: `stitch.txt`
