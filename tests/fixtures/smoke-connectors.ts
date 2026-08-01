import {
  ConnectorPack,
  ReadOnlyConnector,
  mapPayloadToGraph,
  type NormalizedSyncPayload,
} from "../../src/connectors/index.js";
import { GOOGLE_CALENDAR_CONNECTOR_NAME } from "../../src/connectors/personal/google-calendar/connector.js";
import { WEATHER_CONNECTOR_NAME } from "../../src/connectors/personal/weather/connector.js";
import {
  buildWeatherPayload,
  parseOpenMeteoHourly,
} from "../../src/connectors/personal/weather/map-forecast.js";
import type { InMemoryGraphStore } from "../../src/graph/memory-store.js";
import { EdgeKind, NodeKind } from "../../src/graph/models.js";

export const SMOKE_USER_ID = "smoke-user";
export const SMOKE_EVENT_LABEL = "Outdoor standup";
export const SMOKE_WEATHER_TIME = "2026-08-01T18:00";
export const SMOKE_EVENT_START = "2026-08-01T18:15:00.000Z";
export const SMOKE_EVENT_END = "2026-08-01T19:00:00.000Z";

export class SmokeCalendarConnector extends ReadOnlyConnector {
  readonly definition = {
    name: GOOGLE_CALENDAR_CONNECTOR_NAME,
    pack: ConnectorPack.PERSONAL,
    description: "Smoke-test calendar fixture",
    readOnly: true,
  };

  async fetch(): Promise<NormalizedSyncPayload> {
    return {
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
    };
  }
}

export class SmokeWeatherConnector extends ReadOnlyConnector {
  readonly definition = {
    name: WEATHER_CONNECTOR_NAME,
    pack: ConnectorPack.PERSONAL,
    description: "Smoke-test weather fixture",
    readOnly: true,
  };

  constructor(private readonly store: InMemoryGraphStore) {
    super();
  }

  async fetch(userId: string): Promise<NormalizedSyncPayload> {
    const snapshot = await this.store.getSnapshot(userId);
    const periods = parseOpenMeteoHourly(
      {
        time: [SMOKE_WEATHER_TIME],
        precipitation_probability: [80],
        weathercode: [95],
      },
      50,
    );
    return buildWeatherPayload(snapshot, periods);
  }

  async sync(userId: string) {
    const snapshot = await this.store.getSnapshot(userId);
    const payload = await this.fetch(userId);
    return mapPayloadToGraph(userId, this.definition.name, payload, {
      resolveExternalNodeId: (externalId) =>
        snapshot.nodes.find((node) => String(node.data.externalId ?? node.id) === externalId)?.id,
    });
  }
}

export function createSmokeConnectorPayload(): {
  calendar: NormalizedSyncPayload;
  weatherPeriodCount: number;
} {
  const periods = parseOpenMeteoHourly(
    {
      time: [SMOKE_WEATHER_TIME],
      precipitation_probability: [80],
      weathercode: [95],
    },
    50,
  );

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
