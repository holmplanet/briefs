import { EdgeKind, NodeKind, type GraphSnapshot } from "../graph/models.js";
import { InsightKind, type ChangeSet, type Insight } from "./engine.js";

function parseTime(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function findWeatherConflicts(snapshot: GraphSnapshot): Insight[] {
  const insights: Insight[] = [];
  const nodesById = new Map(snapshot.nodes.map((node) => [node.id, node]));

  for (const edge of snapshot.edges) {
    if (edge.kind !== EdgeKind.DEPENDS_ON) {
      continue;
    }

    const event = nodesById.get(edge.sourceId);
    const weather = nodesById.get(edge.targetId);
    if (!event || event.kind !== NodeKind.EVENT || weather?.kind !== NodeKind.WEATHER) {
      continue;
    }

    const precip = weather.data.precipitationProbability;
    const summary = weather.data.summary ?? weather.label;
    insights.push({
      kind: InsightKind.CONFLICT,
      message: `“${event.label}” overlaps ${summary} weather.`,
      priority: 1,
      relatedNodeIds: [event.id, weather.id],
    });
  }

  return insights;
}

function findUpcomingEvents(snapshot: GraphSnapshot, withinHours = 24): Insight[] {
  const now = Date.now();
  const horizon = now + withinHours * 60 * 60 * 1000;
  const insights: Insight[] = [];

  for (const node of snapshot.nodes) {
    if (node.kind !== NodeKind.EVENT) continue;
    const start = parseTime(node.startsAt);
    if (start === undefined || start < now || start > horizon) continue;

    insights.push({
      kind: InsightKind.REMINDER,
      message: `Upcoming: ${node.label}`,
      priority: 3,
      relatedNodeIds: [node.id],
    });
  }

  return insights;
}

export function analyzeGraph(snapshot: GraphSnapshot): ChangeSet {
  const insights: Insight[] = [];

  if (snapshot.nodes.length === 0) {
    insights.push({
      kind: InsightKind.MISSING_INFO,
      message: "No graph data yet. Connect a calendar and run sync_connectors.",
      priority: 2,
      relatedNodeIds: [],
    });
  } else {
    insights.push(...findWeatherConflicts(snapshot));
    if (insights.length === 0) {
      insights.push(...findUpcomingEvents(snapshot));
    }
  }

  return {
    userId: snapshot.userId,
    generatedAt: new Date().toISOString(),
    insights,
  };
}
