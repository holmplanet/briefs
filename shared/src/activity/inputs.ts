import { z } from "zod";

import { isoDateTimeSchema } from "../common/iso-datetime.js";
import { SUMMARY_REQUIRED_TYPES } from "./constants.js";
import { activityResultSchema } from "./result.js";

const activityVerbInputSchema = z
  .string()
  .min(1)
  .regex(/^[A-Z][A-Za-z0-9]*(:[A-Za-z][A-Za-z0-9]+)?$/);

export const activityRecordInputSchema = z
  .object({
    type: activityVerbInputSchema,
    actorId: z.string().uuid(),
    itemId: z.string().uuid(),
    origin: z.string().min(1).optional(),
    target: z.string().min(1).optional(),
    summary: z.string().min(1).optional(),
    occurredAt: isoDateTimeSchema.optional(),
    result: activityResultSchema.optional(),
    clientKey: z.string().min(1).optional(),
  })
  .superRefine((input, ctx) => {
    if (SUMMARY_REQUIRED_TYPES.has(input.type) && !input.summary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `summary is required for activity type ${input.type}`,
        path: ["summary"],
      });
    }
  });

export type ActivityRecordInput = z.infer<typeof activityRecordInputSchema>;
