import { EdgeKind } from "../../graph/models.js";
import { InsightKind } from "../types.js";
import type { ReasoningRule } from "./types.js";

const STALE_EDGE_KINDS = new Set<EdgeKind>([EdgeKind.WAITING_ON, EdgeKind.BLOCKED_BY]);
const DEFAULT_STALE_DAYS = 3;

function staleDays(context: { now: Date }, updatedAt: string): number {
  const updated = Date.parse(updatedAt);
  if (Number.isNaN(updated)) {
    return DEFAULT_STALE_DAYS;
  }
  return Math.max(1, Math.floor((context.now.getTime() - updated) / (24 * 60 * 60 * 1000)));
}

export const staleDependenciesRule: ReasoningRule = {
  name: "stale-dependencies",
  analyze(context) {
    const nodesById = new Map(context.snapshot.nodes.map((node) => [node.id, node]));
    const staleThresholdMs = DEFAULT_STALE_DAYS * 24 * 60 * 60 * 1000;
    const insights = [];

    for (const edge of context.snapshot.edges) {
      if (!STALE_EDGE_KINDS.has(edge.kind)) {
        continue;
      }

      const source = nodesById.get(edge.sourceId);
      const target = nodesById.get(edge.targetId);
      if (!source || !target) {
        continue;
      }

      const targetUpdated = Date.parse(target.updatedAt);
      if (Number.isNaN(targetUpdated) || context.now.getTime() - targetUpdated < staleThresholdMs) {
        continue;
      }

      const days = staleDays(context, target.updatedAt);
      insights.push({
        id: `stale-dependency:${edge.id}`,
        kind: InsightKind.DELAY,
        message: `“${source.label}” is waiting on “${target.label}” (stale ${days}d).`,
        priority: 1,
        relatedNodeIds: [source.id, target.id],
      });
    }

    return insights;
  },
};
