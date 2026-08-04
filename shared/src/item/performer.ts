import { z } from "zod";

import { ActorType } from "../actor/constants.js";

/** Who performed the write — distinct from item owner (attributedToActorId). */
export const itemPerformerSchema = z
  .object({
    kind: z.enum([ActorType.PERSON, ActorType.SERVICE, ActorType.APPLICATION]),
    identity: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
  })
  .superRefine((performer, ctx) => {
    if (performer.kind !== ActorType.PERSON && !performer.identity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "identity is required when performer is not a person",
        path: ["identity"],
      });
    }
  });

export type ItemPerformer = z.infer<typeof itemPerformerSchema>;
