import type { GraphSnapshot } from "../graph/models.js";
import { analyzeContext, analyzeGraph } from "./analyze.js";
import { buildReasoningContext, type BuildReasoningContextOptions } from "./context.js";
import type { ReasoningContext } from "./rules/types.js";
import type { ChangeSet } from "./types.js";

export { InsightKind } from "./types.js";
export type { ChangeSet, Insight } from "./types.js";

export class ReasoningEngine {
  analyze(snapshot: GraphSnapshot, options: BuildReasoningContextOptions = {}): ChangeSet {
    return analyzeGraph(snapshot, options);
  }

  analyzeContext(context: ReasoningContext): ChangeSet {
    return analyzeContext(context);
  }

  buildContext(snapshot: GraphSnapshot, options: BuildReasoningContextOptions = {}): ReasoningContext {
    return buildReasoningContext(snapshot, options);
  }
}

export const reasoningEngine = new ReasoningEngine();
