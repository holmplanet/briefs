# @briefs/shared

Shared types for **item**, **actor**, and **activity** data contracts.

## Layout

```
src/
  common/          shared Zod helpers
  actor/           who acted
  activity/        append-only event log
  item/            durable item + ingest source + workflow projection
```

```ts
import { Item, itemSchema, itemCreateInputSchema } from "@briefs/shared";
import { ActivityType } from "@briefs/shared/activity";
```

Schema exports use entity-first names: `itemSchema`, `itemCreateInputSchema`, `activityRecordInputSchema`.

## Item content contract

An item has one human- and agent-readable body: `description`. Its value is a Markdown-formatted
string. Use `name` for the short display title and `context` for structured vertical or scope
metadata; `context` is not a second body field.

```json
{
  "name": "Ship the docs",
  "kind": "task",
  "description": "## Outcome\\n\\nPublish the SDK docs.\\n\\n- [ ] Add the examples\\n- [ ] Deploy the site",
  "context": "core"
}
```
