import type { NormalizedSyncPayload } from "../../src/connectors/types.js";
import { EdgeKind, NodeKind } from "../../src/graph/models.js";
import { ingestContext } from "../../src/mcp/ingest-service.js";
import { buildWeatherPayload, parseOpenMeteoHourly } from "./smoke-weather.js";

export const SMOKE_USER_ID = "smoke-user";
export const SMOKE_EVENT_LABEL = "Outdoor standup";
export const SMOKE_WEATHER_TIME = "2026-08-01T18:00";
export const SMOKE_EVENT_START = "2026-08-01T18:15:00.000Z";
export const SMOKE_EVENT_END = "2026-08-01T19:00:00.000Z";

const SMOKE_HOURLY = {
  time: [SMOKE_WEATHER_TIME],
  precipitation_probability: [80],
  weathercode: [95],
} as const;

export function createSmokeConnectorPayload(): {
  calendar: NormalizedSyncPayload;
  weatherPeriodCount: number;
} {
  const periods = parseOpenMeteoHourly(SMOKE_HOURLY, 50);

  return {
    calendar: {
      nodes: [
        {
          externalId: "smoke-event-1",
          kind: NodeKind.EVENT,
          label: SMOKE_EVENT_LABEL,
          startsAt: SMOKE_EVENT_START,
          endsAt: SMOKE_EVENT_END,
        },
      ],
      edges: [],
    },
    weatherPeriodCount: periods.length,
  };
}

export function expectSmokeGraphShape(
  snapshot: {
    nodes: Array<{ kind: string }>;
    edges: Array<{ kind: string }>;
  },
): void {
  if (!snapshot.nodes.some((node) => node.kind === NodeKind.EVENT)) {
    throw new Error("Expected calendar event node in graph");
  }
  if (!snapshot.nodes.some((node) => node.kind === NodeKind.WEATHER)) {
    throw new Error("Expected weather node in graph");
  }
  if (!snapshot.edges.some((edge) => edge.kind === EdgeKind.DEPENDS_ON)) {
    throw new Error("Expected depends_on edge between event and weather");
  }
}

export async function ingestSmokeGraph(userId: string): Promise<void> {
  const { calendar } = createSmokeConnectorPayload();

  await ingestContext({
    userId,
    source: "smoke-calendar",
    nodes: calendar.nodes,
    edges: calendar.edges,
  });

  const { getGraphStore } = await import("../../src/graph/runtime.js");
  const snapshot = await getGraphStore().getSnapshot(userId);
  const periods = parseOpenMeteoHourly(SMOKE_HOURLY, 50);
  const weatherPayload = buildWeatherPayload(snapshot, periods);

  await ingestContext({
    userId,
    source: "smoke-weather",
    nodes: weatherPayload.nodes,
    edges: weatherPayload.edges,
  });
}

export const smokeCalendarIngestArgs = {
  source: "smoke-calendar",
  nodes: createSmokeConnectorPayload().calendar.nodes,
  edges: [] as NormalizedSyncPayload["edges"],
};

export async function buildSmokeWeatherIngestArgs(userId: string) {
  const { getGraphStore } = await import("../../src/graph/runtime.js");
  const snapshot = await getGraphStore().getSnapshot(userId);
  const periods = parseOpenMeteoHourly(SMOKE_HOURLY, 50);
  const weatherPayload = buildWeatherPayload(snapshot, periods);
  return {
    source: "smoke-weather",
    nodes: weatherPayload.nodes,
    edges: weatherPayload.edges,
  };
}
