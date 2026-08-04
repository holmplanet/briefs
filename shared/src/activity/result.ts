import { z } from "zod";

import { itemSourceSchema } from "../item/source.js";

export const activityChangeSchema = z.object({
  field: z.string().min(1),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
});

export type ActivityChange = z.infer<typeof activityChangeSchema>;

export const activityCreatedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  kind: z.string().min(1),
  source: itemSourceSchema.optional(),
});

export type ActivityCreated = z.infer<typeof activityCreatedSchema>;

export const activityResultSchema = z.object({
  changes: z.array(activityChangeSchema).optional(),
  created: activityCreatedSchema.optional(),
});

export type ActivityResult = z.infer<typeof activityResultSchema>;
