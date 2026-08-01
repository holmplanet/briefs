import { NodeKind, type GraphNode } from "../../graph/models.js";
import { InsightKind } from "../types.js";
import type { ReasoningRule } from "./types.js";

function eventWindow(node: GraphNode): { start: number; end: number } | undefined {
  if (!node.startsAt) {
    return undefined;
  }
  const start = Date.parse(node.startsAt);
  const end = node.endsAt ? Date.parse(node.endsAt) : start + 60 * 60 * 1000;
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return undefined;
  }
  return { start, end };
}

function windowsOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
): boolean {
  return a.start < b.end && a.end > b.start;
}

export const scheduleConflictsRule: ReasoningRule = {
  name: "schedule-conflicts",
  analyze({ snapshot }) {
    const events = snapshot.nodes
      .filter((node) => node.kind === NodeKind.EVENT)
      .map((node) => ({ node, window: eventWindow(node) }))
      .filter((entry): entry is { node: GraphNode; window: { start: number; end: number } } =>
        Boolean(entry.window),
      );

    const insights = [];

    for (let left = 0; left < events.length; left += 1) {
      for (let right = left + 1; right < events.length; right += 1) {
        const first = events[left];
        const second = events[right];
        if (!first || !second || !windowsOverlap(first.window, second.window)) {
          continue;
        }

        const [a, b] = [first.node, second.node].sort((leftNode, rightNode) =>
          leftNode.id.localeCompare(rightNode.id),
        );

        insights.push({
          id: `schedule-conflict:${a.id}:${b.id}`,
          kind: InsightKind.CONFLICT,
          message: `“${a.label}” overlaps with “${b.label}”.`,
          priority: 1,
          relatedNodeIds: [a.id, b.id],
        });
      }
    }

    return insights;
  },
};
