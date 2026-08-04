import { randomUUID } from "node:crypto";

import { ActivityType } from "@briefs/shared/activity";
import {
  ITEM_DEFAULT_CONTEXT,
  ItemArchiveStatus,
  ItemStatus,
  diffItems,
  type CreateItemInput,
  type Item,
  type ItemStatus as ItemStatusType,
  type ItemStore,
  type UpdateItemInput,
} from "@briefs/shared/item";

import type { ActivityService } from "../activity/service.js";
import type { ActorService } from "../actor/service.js";

export class ItemService {
  constructor(
    private readonly store: ItemStore,
    private readonly actors: ActorService,
    private readonly activities: ActivityService,
  ) {}

  list(userId: string, status?: ItemStatusType): Promise<Item[]> {
    return this.store.listForUser(userId, status);
  }

  get(userId: string, itemId: string): Promise<Item | undefined> {
    return this.store.get(itemId).then((item) => {
      if (!item || item.userId !== userId) {
        return undefined;
      }
      return item;
    });
  }

  listActivities(userId: string, itemId: string) {
    return this.get(userId, itemId).then((item) => {
      if (!item) {
        throw new Error(`Item not found: ${itemId}`);
      }
      return this.activities.listForItem(itemId);
    });
  }

  async create(userId: string, input: CreateItemInput): Promise<Item> {
    if (input.source) {
      const existing = await this.store.getBySource(userId, input.source);
      if (existing) {
        return existing;
      }
    }

    const owner = await this.actors.ensurePerson(userId);
    const performer = await this.actors.resolvePerformer(userId, input.performer);
    const recordedAt = new Date().toISOString();
    const publishedAt = input.publishedAt ?? recordedAt;
    const ingestedAt = input.source ? (input.ingestedAt ?? recordedAt) : input.ingestedAt;
    const context = input.context ?? ITEM_DEFAULT_CONTEXT;

    const item: Item = {
      schemaVersion: 3,
      id: randomUUID(),
      userId,
      label: input.label.trim(),
      status: input.status ?? ItemStatus.OPEN,
      dueAt: input.dueAt,
      scheduledAt: input.scheduledAt,
      priority: input.priority,
      description: input.description,
      itemType: input.itemType ?? "item",
      attributedToActorId: owner.id,
      context,
      originContext: input.originContext ?? context,
      tags: input.tags,
      refs: input.refs,
      archiveStatus: ItemArchiveStatus.ACTIVE,
      source: input.source,
      ingestedAt,
      publishedAt,
      createdAt: recordedAt,
      updatedAt: recordedAt,
    };

    await this.store.save(item);
    await this.activities.record({
      type: ActivityType.CREATE,
      actorId: performer.id,
      itemId: item.id,
      occurredAt: publishedAt,
      result: {
        created: {
          id: item.id,
          label: item.label,
          itemType: item.itemType,
          source: item.source,
        },
      },
      clientKey: input.clientKey,
    });

    return item;
  }

  async update(userId: string, itemId: string, input: UpdateItemInput): Promise<Item> {
    const existing = await this.store.get(itemId);
    if (!existing || existing.userId !== userId) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const performer = await this.actors.resolvePerformer(userId, input.performer);
    const nextStatus = input.status ?? existing.status;
    const completedAt = resolveCompletedAt(existing, input, nextStatus);
    const now = new Date().toISOString();
    const nextContext = input.context ?? existing.context;

    const updated: Item = {
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
      context: nextContext,
      tags: input.tags === null ? undefined : (input.tags ?? existing.tags),
      refs: input.refs === null ? undefined : (input.refs ?? existing.refs),
      archiveStatus: input.archiveStatus ?? existing.archiveStatus,
      updatedAt: now,
    };

    const changes = diffItems(existing, updated);
    const activityType = resolveActivityType(existing, updated);
    const activityInput = {
      actorId: performer.id,
      itemId,
      summary: input.summary,
      clientKey: input.clientKey,
      result: { changes },
    };

    if (activityType === ActivityType.MOVE) {
      await this.activities.record({
        ...activityInput,
        type: ActivityType.MOVE,
        origin: existing.context,
        target: updated.context,
        occurredAt: now,
      });
    } else if (activityType === ActivityType.DELETE) {
      await this.activities.record({
        ...activityInput,
        type: ActivityType.DELETE,
        summary: input.summary ?? "Archived item",
        occurredAt: now,
      });
    } else {
      await this.activities.record({
        ...activityInput,
        type: ActivityType.UPDATE,
        occurredAt: now,
      });
    }

    await this.store.update(updated);
    return updated;
  }
}

function resolveActivityType(
  before: Item,
  after: Item,
): typeof ActivityType.UPDATE | typeof ActivityType.MOVE | typeof ActivityType.DELETE {
  if (
    before.archiveStatus === ItemArchiveStatus.ACTIVE &&
    after.archiveStatus === ItemArchiveStatus.ARCHIVED
  ) {
    return ActivityType.DELETE;
  }
  if (before.context !== after.context) {
    return ActivityType.MOVE;
  }
  return ActivityType.UPDATE;
}

function resolveCompletedAt(
  existing: Item,
  input: UpdateItemInput,
  nextStatus: ItemStatusType,
): string | undefined {
  if (input.completedAt === null) {
    return undefined;
  }
  if (input.completedAt) {
    return input.completedAt;
  }
  if (nextStatus === ItemStatus.DONE && existing.status !== ItemStatus.DONE) {
    return new Date().toISOString();
  }
  if (nextStatus !== ItemStatus.DONE) {
    return undefined;
  }
  return existing.completedAt;
}
