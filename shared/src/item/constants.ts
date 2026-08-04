export const ITEM_SCHEMA_VERSION = 4 as const;

/** Default vertical/system context for new items. */
export const ITEM_DEFAULT_CONTEXT = "core" as const;

/** Lifecycle on the item — distinct from workflow status. */
export const ItemLifecycle = {
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

export type ItemLifecycle = (typeof ItemLifecycle)[keyof typeof ItemLifecycle];

/** Typed links between items. */
export const ItemRefRel = {
  ADDRESSES: "addresses",
  DUPLICATES: "duplicates",
  SUPERSEDES: "supersedes",
  PARENT: "parent",
  RELATES: "relates",
} as const;

export type ItemRefRel = (typeof ItemRefRel)[keyof typeof ItemRefRel];

export const ItemStatus = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  CANCELLED: "cancelled",
} as const;

export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export const ItemPriority = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type ItemPriority = (typeof ItemPriority)[keyof typeof ItemPriority];
