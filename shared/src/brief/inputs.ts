import { z } from "zod";

import { BriefKind } from "./constants.js";

export const generateBriefInputSchema = z.object({
  kind: z.nativeEnum(BriefKind).optional(),
});

export type GenerateBriefInput = z.infer<typeof generateBriefInputSchema>;
