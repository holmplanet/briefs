import { z } from "zod";

import { isoDateTimeSchema } from "../common/iso-datetime.js";
import {
  ITEM_DEFAULT_CONTEXT,
  ITEM_SCHEMA_VERSION,
  ItemLifecycle,
  ItemPriority,
  ItemRefRel,
  ItemStatus,
} from "./constants.js";
import { itemSourceSchema } from "./source.js";

export const itemRefSchema = z.object({
  rel: z.enum([
    ItemRefRel.ADDRESSES,
    ItemRefRel.DUPLICATES,
    ItemRefRel.SUPERSEDES,
    ItemRefRel.PARENT,
    ItemRefRel.RELATES,
  ]),
  target: z.string().uuid(),
});

export type ItemRef = z.infer<typeof itemRefSchema>;

/**
 * Item — the durable entity in Briefs.
 *
 * `name` is the display title; `description` is the write-up body.
 * Workflow fields remain top-level for query convenience; they should only
 * change via Activities in the write path.
 */
export const itemSchema = z
  .object({
    schemaVersion: z.literal(ITEM_SCHEMA_VERSION),
    id: z.string().uuid(),
    userId: z.string().min(1),
    name: z.string().min(1),
    status: z.enum([
      ItemStatus.OPEN,
      ItemStatus.IN_PROGRESS,
      ItemStatus.DONE,
      ItemStatus.CANCELLED,
    ]),
    dueAt: isoDateTimeSchema.optional(),
    scheduledAt: isoDateTimeSchema.optional(),
    completedAt: isoDateTimeSchema.optional(),
    priority: z
      .enum([ItemPriority.LOW, ItemPriority.NORMAL, ItemPriority.HIGH, ItemPriority.URGENT])
      .optional(),
    description: z.string().optional(),
    kind: z.string().min(1).default("task"),
    ownerActorId: z.string().uuid(),
    context: z.string().min(1).default(ITEM_DEFAULT_CONTEXT),
    originContext: z.string().min(1).default(ITEM_DEFAULT_CONTEXT),
    tags: z.array(z.string().min(1)).optional(),
    refs: z.array(itemRefSchema).optional(),
    lifecycle: z
      .enum([ItemLifecycle.ACTIVE, ItemLifecycle.ARCHIVED])
      .default(ItemLifecycle.ACTIVE),
    source: itemSourceSchema.optional(),
    /** When Briefs first ingested this item from an external system. */
    ingestedAt: isoDateTimeSchema.optional(),
    state: z.record(z.unknown()).optional(),
    /** When this item occurred in the world (may predate Briefs). */
    occurredAt: isoDateTimeSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export type Item = z.infer<typeof itemSchema>;
