import type { GraphSnapshot } from "../graph/models.js";
import { analyzeGraph } from "./analyze.js";

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
    return analyzeGraph(snapshot);
  }
}

export const reasoningEngine = new ReasoningEngine();
