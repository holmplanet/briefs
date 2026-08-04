# @briefs/shared

Shared types for **Item (Object)**, **Actor**, and **Activity** — passport-inspired data contracts.

## Layout

```
src/
  common/          shared Zod helpers
  actor/           who acted
  activity/        append-only event log
  item/            durable Object + workflow projection
```

```ts
import { Item, itemSchema } from "@briefs/shared";
import { ActivityType } from "@briefs/shared/activity";
```
