import { z } from "zod";

/** External provenance for ingested items (calendar, assistant, etc.). */
export const itemSourceSchema = z.object({
  system: z.string().min(1),
  externalId: z.string().min(1),
  externalUrl: z.string().url().optional(),
});

export type ItemSource = z.infer<typeof itemSourceSchema>;
