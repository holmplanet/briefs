import type { GraphSnapshot } from "../../graph/models.js";
import type { Insight } from "../types.js";

export type ReasoningContext = {
  snapshot: GraphSnapshot;
  now: Date;
  since?: string;
  lastSyncAt?: string;
};

export type ReasoningRule = {
  readonly name: string;
  analyze(context: ReasoningContext): Insight[];
};
