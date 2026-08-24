import { z } from "zod";

import { ItemPriority, ItemStatus } from "./constants.js";
import { itemPerformerSchema } from "./performer.js";
import { itemRefSchema } from "./schema.js";
import { itemSourceSchema } from "./source.js";

export const itemCreateInputSchema = z.object({
  name: z.string().min(1),
  status: z.nativeEnum(ItemStatus).optional(),
  dueAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  priority: z.nativeEnum(ItemPriority).optional(),
  /** Markdown-formatted body for humans and agents. */
  description: z.string().optional(),
  kind: z.string().min(1).optional(),
  context: z.string().min(1).optional(),
  originContext: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  refs: z.array(itemRefSchema).optional(),
  source: itemSourceSchema.optional(),
  occurredAt: z.string().optional(),
  ingestedAt: z.string().optional(),
  performer: itemPerformerSchema.optional(),
  clientKey: z.string().min(1).optional(),
});

export type ItemCreateInput = z.infer<typeof itemCreateInputSchema>;

export const itemUpdateInputSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.nativeEnum(ItemStatus).optional(),
  dueAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  priority: z.nativeEnum(ItemPriority).nullable().optional(),
  /** Markdown-formatted body for humans and agents. */
  description: z.string().nullable().optional(),
  context: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).nullable().optional(),
  refs: z.array(itemRefSchema).nullable().optional(),
  lifecycle: z.enum(["active", "archived"]).optional(),
  summary: z.string().min(1).optional(),
  performer: itemPerformerSchema.optional(),
  clientKey: z.string().min(1).optional(),
});

export type ItemUpdateInput = z.infer<typeof itemUpdateInputSchema>;
