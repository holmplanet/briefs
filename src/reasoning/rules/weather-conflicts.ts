import { EdgeKind, NodeKind } from "../../graph/models.js";
import { InsightKind } from "../types.js";
import type { ReasoningRule } from "./types.js";

export const weatherConflictsRule: ReasoningRule = {
  name: "weather-conflicts",
  analyze({ snapshot }) {
    const nodesById = new Map(snapshot.nodes.map((node) => [node.id, node]));
    const insights = [];

    for (const edge of snapshot.edges) {
      if (edge.kind !== EdgeKind.DEPENDS_ON) {
        continue;
      }

      const event = nodesById.get(edge.sourceId);
      const weather = nodesById.get(edge.targetId);
      if (!event || event.kind !== NodeKind.EVENT || weather?.kind !== NodeKind.WEATHER) {
        continue;
      }

      const summary = String(weather.data.summary ?? weather.label);
      insights.push({
        id: `weather-conflict:${event.id}:${weather.id}`,
        kind: InsightKind.CONFLICT,
        message: `“${event.label}” overlaps ${summary} weather.`,
        priority: 1,
        relatedNodeIds: [event.id, weather.id],
      });
    }

    return insights;
  },
};
