import type { ActivityChange } from "../activity/result.js";
import type { Item } from "./schema.js";

const TRACKED_ITEM_FIELDS = [
  "name",
  "status",
  "dueAt",
  "scheduledAt",
  "completedAt",
  "priority",
  "description",
  "kind",
  "context",
  "tags",
  "refs",
  "lifecycle",
] as const satisfies readonly (keyof Item)[];

function valuesEqual(before: unknown, after: unknown): boolean {
  return JSON.stringify(before ?? null) === JSON.stringify(after ?? null);
}

/** Build structured field deltas between two item projections. */
export function diffItems(before: Item, after: Item): ActivityChange[] {
  const changes: ActivityChange[] = [];

  for (const field of TRACKED_ITEM_FIELDS) {
    const previous = before[field];
    const next = after[field];
    if (!valuesEqual(previous, next)) {
      changes.push({ field, before: previous, after: next });
    }
  }

  return changes;
}
