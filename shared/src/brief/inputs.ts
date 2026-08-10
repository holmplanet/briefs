import { z } from "zod";

export const briefCreateInputSchema = z.object({
  kind: z.enum(["morning", "on_demand"]),
  headline: z.string().min(1),
  summary: z.string().min(1),
  itemIds: z.array(z.string().uuid()).default([]),
});

export type BriefCreateInput = z.infer<typeof briefCreateInputSchema>;
