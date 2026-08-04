import { z } from "zod";

import { isoDateTimeSchema } from "../common/iso-datetime.js";
import { ACTIVITY_SCHEMA_VERSION } from "./constants.js";

const activityVerbSchema = z
  .string()
  .min(1)
  .regex(/^[A-Z][A-Za-z0-9]*(:[A-Za-z][A-Za-z0-9]+)?$/);

export const activitySchema = z
  .object({
    schemaVersion: z.literal(ACTIVITY_SCHEMA_VERSION),
    id: z.string().uuid(),
    type: activityVerbSchema,
    actorId: z.string().uuid(),
    /** Item (Object) this activity applies to. */
    objectId: z.string().uuid(),
    origin: z.string().min(1).optional(),
    target: z.string().min(1).optional(),
    summary: z.string().min(1).optional(),
    /** When it happened in the world. */
    occurredAt: isoDateTimeSchema,
    /** When Briefs recorded it — set by the write path only. */
    recordedAt: isoDateTimeSchema,
    result: z.record(z.unknown()).optional(),
    clientKey: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((activity, ctx) => {
    if (activity.occurredAt > activity.recordedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "occurredAt must not be later than recordedAt",
        path: ["occurredAt"],
      });
    }
  });

export type Activity = z.infer<typeof activitySchema>;
