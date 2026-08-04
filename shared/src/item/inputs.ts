import { z } from "zod";

import { ItemPriority, ItemStatus } from "./constants.js";
import { itemRefSchema } from "./schema.js";

export const createItemInputSchema = z.object({
  label: z.string().min(1),
  status: z.nativeEnum(ItemStatus).optional(),
  dueAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  priority: z.nativeEnum(ItemPriority).optional(),
  description: z.string().optional(),
  objectType: z.string().min(1).optional(),
  context: z.string().min(1).optional(),
  originContext: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  refs: z.array(itemRefSchema).optional(),
  clientKey: z.string().min(1).optional(),
});

export type CreateItemInput = z.infer<typeof createItemInputSchema>;

export const updateItemInputSchema = z.object({
  label: z.string().min(1).optional(),
  status: z.nativeEnum(ItemStatus).optional(),
  dueAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  priority: z.nativeEnum(ItemPriority).nullable().optional(),
  description: z.string().nullable().optional(),
  context: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).nullable().optional(),
  refs: z.array(itemRefSchema).nullable().optional(),
  archiveStatus: z.enum(["active", "archived"]).optional(),
  summary: z.string().min(1).optional(),
  clientKey: z.string().min(1).optional(),
});

export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;
