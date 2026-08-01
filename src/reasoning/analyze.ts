import { InsightKind, type ChangeSet, type Insight } from "./types.js";
import { buildReasoningContext } from "./context.js";
import { defaultReasoningRuleRegistry } from "./rules/registry.js";
import type { BuildReasoningContextOptions } from "./context.js";
import type { GraphSnapshot } from "../graph/models.js";
import type { ReasoningContext } from "./rules/types.js";

const HIGH_PRIORITY_KINDS = new Set<InsightKind>([
  InsightKind.CONFLICT,
  InsightKind.DELAY,
  InsightKind.OPPORTUNITY,
]);

function emptyGraphInsight(): Insight {
  return {
    id: "missing-graph-data",
    kind: InsightKind.MISSING_INFO,
    message: "No graph data yet. Connect a calendar and run sync_connectors.",
    priority: 2,
    relatedNodeIds: [],
  };
}

function mergeInsights(ruleInsights: Insight[]): Insight[] {
  const byId = new Map<string, Insight>();
  for (const insight of ruleInsights) {
    byId.set(insight.id, insight);
  }
  return [...byId.values()].sort((a, b) => a.priority - b.priority);
}

export function runReasoningRules(context: ReasoningContext): Insight[] {
  if (context.snapshot.nodes.length === 0) {
    return [emptyGraphInsight()];
  }

  const ruleInsights = defaultReasoningRuleRegistry
    .list()
    .flatMap((rule) => rule.analyze(context));

  const merged = mergeInsights(ruleInsights);
  const highPriority = merged.filter((insight) => HIGH_PRIORITY_KINDS.has(insight.kind));

  if (highPriority.length > 0) {
    return highPriority;
  }

  return merged;
}

export function analyzeGraph(
  snapshot: GraphSnapshot,
  options: BuildReasoningContextOptions = {},
): ChangeSet {
  const context = buildReasoningContext(snapshot, options);
  return analyzeContext(context);
}

export function analyzeContext(context: ReasoningContext): ChangeSet {
  return {
    userId: context.snapshot.userId,
    generatedAt: context.now.toISOString(),
    insights: runReasoningRules(context),
    lastSyncAt: context.lastSyncAt,
    since: context.since,
  };
}
