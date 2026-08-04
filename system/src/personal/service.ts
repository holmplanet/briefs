import { randomUUID } from "node:crypto";

import {
  StitchStatus,
  type CreateStitchInput,
  type Stitch,
  type StitchStatus as StitchStatusType,
  type StitchStore,
  type UpdateStitchInput,
} from "@brief/shared";

export class PersonalStitchService {
  constructor(private readonly store: StitchStore) {}

  list(userId: string, status?: StitchStatusType): Promise<Stitch[]> {
    return this.store.listForUser(userId, status);
  }

  async create(userId: string, input: CreateStitchInput): Promise<Stitch> {
    const now = new Date().toISOString();
    const stitch: Stitch = {
      schemaVersion: 1,
      id: randomUUID(),
      userId,
      label: input.label.trim(),
      status: input.status ?? StitchStatus.OPEN,
      dueAt: input.dueAt,
      scheduledAt: input.scheduledAt,
      priority: input.priority,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    };

    await this.store.save(stitch);
    return stitch;
  }

  async update(userId: string, stitchId: string, input: UpdateStitchInput): Promise<Stitch> {
    const existing = await this.store.get(stitchId);
    if (!existing || existing.userId !== userId) {
      throw new Error(`Stitch not found: ${stitchId}`);
    }

    const nextStatus = input.status ?? existing.status;
    const completedAt = resolveCompletedAt(existing, input, nextStatus);
    const now = new Date().toISOString();

    const updated: Stitch = {
      ...existing,
      label: input.label?.trim() || existing.label,
      status: nextStatus,
      dueAt: input.dueAt === null ? undefined : (input.dueAt ?? existing.dueAt),
      scheduledAt:
        input.scheduledAt === null ? undefined : (input.scheduledAt ?? existing.scheduledAt),
      completedAt,
      priority: input.priority === null ? undefined : (input.priority ?? existing.priority),
      description:
        input.description === null ? undefined : (input.description ?? existing.description),
      updatedAt: now,
    };

    await this.store.update(updated);
    return updated;
  }
}

function resolveCompletedAt(
  existing: Stitch,
  input: UpdateStitchInput,
  nextStatus: StitchStatusType,
): string | undefined {
  if (input.completedAt === null) {
    return undefined;
  }
  if (input.completedAt) {
    return input.completedAt;
  }
  if (nextStatus === StitchStatus.DONE && existing.status !== StitchStatus.DONE) {
    return new Date().toISOString();
  }
  if (nextStatus !== StitchStatus.DONE) {
    return undefined;
  }
  return existing.completedAt;
}
