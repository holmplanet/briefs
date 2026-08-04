import { randomUUID } from "node:crypto";

import {
  activitySchema,
  type Activity,
  type ActivityStore,
  type RecordActivityInput,
} from "@briefs/shared/activity";

export class ActivityService {
  constructor(private readonly store: ActivityStore) {}

  listForItem(itemId: string): Promise<Activity[]> {
    return this.store.listForItem(itemId);
  }

  async record(input: RecordActivityInput): Promise<Activity> {
    if (input.clientKey) {
      const existing = await this.store.getByClientKey(input.actorId, input.clientKey);
      if (existing) {
        return existing;
      }
    }

    const recordedAt = new Date().toISOString();
    const occurredAt = input.occurredAt ?? recordedAt;
    const activity = activitySchema.parse({
      schemaVersion: 1,
      id: randomUUID(),
      type: input.type,
      actorId: input.actorId,
      itemId: input.itemId,
      origin: input.origin,
      target: input.target,
      summary: input.summary,
      occurredAt,
      recordedAt,
      result: input.result,
      clientKey: input.clientKey,
    });

    return this.store.append(activity);
  }
}
