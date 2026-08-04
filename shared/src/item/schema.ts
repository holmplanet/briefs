import { z } from "zod";

import { isoDateTimeSchema } from "../common/iso-datetime.js";
import {
  ITEM_DEFAULT_CONTEXT,
  ITEM_SCHEMA_VERSION,
  ItemArchiveStatus,
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
 * `label` is the display title; `description` is the write-up body.
 * Workflow fields remain top-level for query convenience; they should only
 * change via Activities in the write path.
 */
export const itemSchema = z
  .object({
    schemaVersion: z.literal(ITEM_SCHEMA_VERSION),
    id: z.string().uuid(),
    userId: z.string().min(1),
    label: z.string().min(1),
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
    itemType: z.string().min(1).default("item"),
    attributedToActorId: z.string().uuid(),
    context: z.string().min(1).default(ITEM_DEFAULT_CONTEXT),
    originContext: z.string().min(1).default(ITEM_DEFAULT_CONTEXT),
    tags: z.array(z.string().min(1)).optional(),
    refs: z.array(itemRefSchema).optional(),
    archiveStatus: z
      .enum([ItemArchiveStatus.ACTIVE, ItemArchiveStatus.ARCHIVED])
      .default(ItemArchiveStatus.ACTIVE),
    source: itemSourceSchema.optional(),
    /** When Briefs first ingested this item from an external system. */
    ingestedAt: isoDateTimeSchema.optional(),
    state: z.record(z.unknown()).optional(),
    publishedAt: isoDateTimeSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export type Item = z.infer<typeof itemSchema>;
