export const STITCH_SCHEMA_VERSION = 1 as const;

export const StitchStatus = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  CANCELLED: "cancelled",
} as const;

export type StitchStatus = (typeof StitchStatus)[keyof typeof StitchStatus];

export const StitchPriority = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type StitchPriority = (typeof StitchPriority)[keyof typeof StitchPriority];
