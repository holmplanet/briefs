export const InsightKind = {
  CONFLICT: "conflict",
  OPPORTUNITY: "opportunity",
  DELAY: "delay",
  MISSING_INFO: "missing_info",
  REMINDER: "reminder",
} as const;

export type InsightKind = (typeof InsightKind)[keyof typeof InsightKind];

export type Insight = {
  id: string;
  kind: InsightKind;
  message: string;
  priority: number;
  relatedNodeIds: string[];
};

export type ChangeSet = {
  userId: string;
  generatedAt: string;
  insights: Insight[];
  lastSyncAt?: string;
  since?: string;
};
