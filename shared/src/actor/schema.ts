import { z } from "zod";

import { isoDateTimeSchema } from "../common/iso-datetime.js";
import { ACTOR_SCHEMA_VERSION, ActorType } from "./constants.js";

export const actorSchema = z
  .object({
    schemaVersion: z.literal(ACTOR_SCHEMA_VERSION),
    id: z.string().uuid(),
    type: z.nativeEnum(ActorType),
    name: z.string().min(1),
    /** SSO principal for a Person; service principal for Service/Application. */
    identity: z.string().min(1),
    createdAt: isoDateTimeSchema,
  })
  .strict();

export type Actor = z.infer<typeof actorSchema>;
