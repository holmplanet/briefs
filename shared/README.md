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
import { Item, itemSchema } from "@briefs/shared";
import { ActivityType } from "@briefs/shared/activity";
```
