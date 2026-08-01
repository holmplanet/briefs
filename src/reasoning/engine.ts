import type { GraphSnapshot } from "../graph/models.js";

export const InsightKind = {
  CONFLICT: "conflict",
  OPPORTUNITY: "opportunity",
  DELAY: "delay",
  MISSING_INFO: "missing_info",
  REMINDER: "reminder",
} as const;

export type InsightKind = (typeof InsightKind)[keyof typeof InsightKind];

export type Insight = {
  kind: InsightKind;
  message: string;
  priority: number;
  relatedNodeIds: string[];
};

export type ChangeSet = {
  userId: string;
  generatedAt: string;
  insights: Insight[];
};

export class ReasoningEngine {
  analyze(snapshot: GraphSnapshot): ChangeSet {
    const insights: Insight[] = [];

    if (snapshot.nodes.length === 0) {
      insights.push({
        kind: InsightKind.MISSING_INFO,
        message: "No graph data yet. Connect a calendar to get started.",
        priority: 2,
        relatedNodeIds: [],
      });
    }

    return {
      userId: snapshot.userId,
      generatedAt: new Date().toISOString(),
      insights,
    };
  }
}

export const reasoningEngine = new ReasoningEngine();
