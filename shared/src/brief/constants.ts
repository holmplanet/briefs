export const BRIEF_SCHEMA_VERSION = 1 as const;

export const BriefKind = {
  MORNING: "morning",
  ON_DEMAND: "on_demand",
  TRAVEL: "travel",
} as const;

export type BriefKind = (typeof BriefKind)[keyof typeof BriefKind];
