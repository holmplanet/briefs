import { z } from "zod";

import { isoDateTimeSchema } from "../common/iso-datetime.js";
import { BRIEF_SCHEMA_VERSION, BriefKind } from "./constants.js";

export const briefBulletSchema = z.object({
  text: z.string().min(1),
  priority: z.number().int().optional(),
});

export type BriefBullet = z.infer<typeof briefBulletSchema>;

export const briefSchema = z
  .object({
    schemaVersion: z.literal(BRIEF_SCHEMA_VERSION),
    id: z.string().uuid(),
    userId: z.string().min(1),
    kind: z.enum([BriefKind.MORNING, BriefKind.ON_DEMAND, BriefKind.TRAVEL]),
    generatedAt: isoDateTimeSchema,
    greeting: z.string().optional(),
    headline: z.string().optional(),
    bullets: z.array(briefBulletSchema),
    relatedStitchIds: z.array(z.string().uuid()),
    createdAt: isoDateTimeSchema,
  })
  .strict();

export type Brief = z.infer<typeof briefSchema>;
