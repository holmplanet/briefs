import { z } from "zod";

export const briefSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().uuid(),
  userId: z.string().min(1),
  kind: z.enum(["morning", "on_demand"]),
  headline: z.string().min(1),
  summary: z.string().min(1),
  itemIds: z.array(z.string().uuid()),
  createdAt: z.string().datetime(),
}).strict();

export type Brief = z.infer<typeof briefSchema>;
