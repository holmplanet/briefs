import { z } from "zod";

import { isoDateTimeSchema } from "../common/iso-datetime.js";
import { STITCH_SCHEMA_VERSION, StitchPriority, StitchStatus } from "./constants.js";

export const stitchSchema = z
  .object({
    schemaVersion: z.literal(STITCH_SCHEMA_VERSION),
    id: z.string().uuid(),
    userId: z.string().min(1),
    label: z.string().min(1),
    status: z.enum([
      StitchStatus.OPEN,
      StitchStatus.IN_PROGRESS,
      StitchStatus.DONE,
      StitchStatus.CANCELLED,
    ]),
    dueAt: isoDateTimeSchema.optional(),
    scheduledAt: isoDateTimeSchema.optional(),
    completedAt: isoDateTimeSchema.optional(),
    priority: z
      .enum([StitchPriority.LOW, StitchPriority.NORMAL, StitchPriority.HIGH, StitchPriority.URGENT])
      .optional(),
    description: z.string().optional(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export type Stitch = z.infer<typeof stitchSchema>;
