import { NodeKind } from "../../graph/models.js";
import { InsightKind } from "../types.js";
import type { ReasoningRule } from "./types.js";

function parseTime(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export const upcomingEventsRule: ReasoningRule = {
  name: "upcoming-events",
  analyze({ snapshot, now }) {
    const horizon = now.getTime() + 24 * 60 * 60 * 1000;
    const insights = [];

    for (const node of snapshot.nodes) {
      if (node.kind !== NodeKind.EVENT) continue;
      const start = parseTime(node.startsAt);
      if (start === undefined || start < now.getTime() || start > horizon) continue;

      insights.push({
        id: `upcoming-event:${node.id}`,
        kind: InsightKind.REMINDER,
        message: `Upcoming: ${node.label}`,
        priority: 3,
        relatedNodeIds: [node.id],
      });
    }

    return insights;
  },
};
