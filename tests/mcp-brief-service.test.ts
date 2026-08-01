import { beforeEach, describe, expect, it } from "vitest";

import {
  ConnectorPack,
  ConnectorRunner,
  ReadOnlyConnector,
  createConnectorRegistry,
  mapPayloadToGraph,
} from "../src/connectors/index.js";
import { resetConnectorRegistry, setConnectorRegistry } from "../src/connectors/runtime.js";
import { InMemoryGraphStore } from "../src/graph/memory-store.js";
import { resetGraphStore, setGraphStore } from "../src/graph/runtime.js";
import { generateBrief, syncConnectors } from "../src/mcp/brief-service.js";
import { BriefKind } from "../src/briefs/generator.js";
import { NodeKind } from "../src/graph/models.js";
import type { NormalizedSyncPayload } from "../src/connectors/types.js";

class CalendarFixture extends ReadOnlyConnector {
  readonly definition = {
    name: "google-calendar",
    pack: ConnectorPack.PERSONAL,
    description: "Fixture calendar",
    readOnly: true,
  };

  async fetch(): Promise<NormalizedSyncPayload> {
    return {
      nodes: [
        {
          externalId: "event-1",
          kind: NodeKind.EVENT,
          label: "Outdoor standup",
          startsAt: "2026-08-01T18:15:00.000Z",
          endsAt: "2026-08-01T19:00:00.000Z",
        },
      ],
      edges: [],
    };
  }
}

class WeatherFixture extends ReadOnlyConnector {
  readonly definition = {
    name: "weather",
    pack: ConnectorPack.PERSONAL,
    description: "Fixture weather",
    readOnly: true,
  };

  async fetch(userId: string): Promise<NormalizedSyncPayload> {
    const snapshot = await this.store.getSnapshot(userId);
    const { buildWeatherPayload, parseOpenMeteoHourly } = await import(
      "../src/connectors/personal/weather/map-forecast.js"
    );
    const periods = parseOpenMeteoHourly(
      {
        time: ["2026-08-01T18:00"],
        precipitation_probability: [80],
        weathercode: [95],
      },
      50,
    );
    return buildWeatherPayload(snapshot, periods);
  }

  constructor(private readonly store: InMemoryGraphStore) {
    super();
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

describe("mcp brief service", () => {
  beforeEach(() => {
    resetGraphStore();
    resetConnectorRegistry();

    const store = new InMemoryGraphStore();
    setGraphStore(store);

    const registry = createConnectorRegistry(new ConnectorRunner(store));
    registry.register(new CalendarFixture());
    registry.register(new WeatherFixture(store));
    setConnectorRegistry(registry);
  });

  it("syncs connectors and surfaces weather conflicts in brief_me", async () => {
    const reports = await syncConnectors("user-1");
    expect(reports).toHaveLength(2);
    expect(reports.every((report) => report.ok)).toBe(true);

    const brief = await generateBrief("user-1", BriefKind.ON_DEMAND, { syncFirst: false });
    expect(brief.bullets.some((bullet) => bullet.text.includes("Outdoor standup"))).toBe(true);
    expect(brief.bullets.some((bullet) => bullet.text.toLowerCase().includes("weather"))).toBe(
      true,
    );
  });
});
