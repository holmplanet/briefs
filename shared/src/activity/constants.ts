export const ACTIVITY_SCHEMA_VERSION = 1 as const;

/**
 * Shared activity vocabulary. System-specific verbs use a namespace prefix,
 * e.g. `livestock:Weigh`.
 */
export const ActivityType = {
  CREATE: "Create",
  UPDATE: "Update",
  MOVE: "Move",
  ACCEPT: "Accept",
  REJECT: "Reject",
  UNDO: "Undo",
  DELETE: "Delete",
  MERGE: "Merge",
} as const;

export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

/** Verbs that require a human reason in `summary`. */
export const SUMMARY_REQUIRED_TYPES = new Set<string>([
  ActivityType.ACCEPT,
  ActivityType.REJECT,
  ActivityType.MERGE,
  ActivityType.UNDO,
  ActivityType.DELETE,
]);
