export const ACTOR_SCHEMA_VERSION = 1 as const;

/** ActivityPub-inspired actor kinds — people and software only; systems are not actors. */
export const ActorType = {
  PERSON: "Person",
  SERVICE: "Service",
  APPLICATION: "Application",
} as const;

export type ActorType = (typeof ActorType)[keyof typeof ActorType];
