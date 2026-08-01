import { beforeEach, describe, expect, it } from "vitest";

import {
  ConnectorRunner,
  ConnectorPack,
  ReadOnlyConnector,
  createConnectorRegistry,
  mapPayloadToGraph,
} from "../src/connectors/index.js";
import { connectorStatusStore } from "../src/connectors/status.js";
import { EdgeKind, NodeKind } from "../src/graph/models.js";
import { InMemoryGraphStore } from "../src/graph/memory-store.js";
import { resetConnectorRegistry, setConnectorRegistry } from "../src/connectors/runtime.js";
import { resetGraphStore, setGraphStore } from "../src/graph/runtime.js";
import type { NormalizedSyncPayload } from "../src/connectors/types.js";

class TestConnector extends ReadOnlyConnector {
  readonly definition = {
    name: "test",
    pack: ConnectorPack.PERSONAL,
    description: "Test connector",
    readOnly: true,
  };

  constructor(
    private readonly payload: NormalizedSyncPayload,
    private readonly fail = false,
  ) {
    super();
  }

  async fetch(): Promise<NormalizedSyncPayload> {
    if (this.fail) {
      throw new Error("sync failed");
    }
    return this.payload;
  }
}

describe("connector framework", () => {
  beforeEach(() => {
    resetGraphStore();
    resetConnectorRegistry();
    connectorStatusStore.clear();
    const store = new InMemoryGraphStore();
    setGraphStore(store);
    setConnectorRegistry(createConnectorRegistry(new ConnectorRunner(store)));
  });

  it("maps normalized payload into graph-compatible records", () => {
    const result = mapPayloadToGraph("user-1", "calendar", {
      nodes: [
        {
          externalId: "event-1",
          kind: NodeKind.EVENT,
          label: "Standup",
        },
      ],
      edges: [],
    });

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]?.data.externalId).toBe("event-1");
    expect(result.nodes[0]?.data.connector).toBe("calendar");
  });

  it("rejects edges with unknown endpoints", () => {
    expect(() =>
      mapPayloadToGraph("user-1", "calendar", {
        nodes: [],
        edges: [
          {
            externalId: "edge-1",
            kind: EdgeKind.DEPENDS_ON,
            sourceExternalId: "missing-a",
            targetExternalId: "missing-b",
          },
        ],
      }),
    ).toThrow(/unknown edge endpoints/i);
  });

  it("resolves edge endpoints from an existing graph when provided", () => {
    const result = mapPayloadToGraph(
      "user-1",
      "weather",
      {
        nodes: [
          {
            externalId: "wx-1",
            kind: NodeKind.WEATHER,
            label: "Rain",
          },
        ],
        edges: [
          {
            externalId: "edge-1",
            kind: EdgeKind.DEPENDS_ON,
            sourceExternalId: "event-1",
            targetExternalId: "wx-1",
          },
        ],
      },
      {
        resolveExternalNodeId: (externalId) =>
          externalId === "event-1" ? "existing-event-node" : undefined,
      },
    );

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.sourceId).toBe("existing-event-node");
    expect(result.edges[0]?.targetId).toBe(result.nodes[0]?.id);
  });

  it("registers connectors without modifying core engine code", () => {
    const registry = createConnectorRegistry(new ConnectorRunner(new InMemoryGraphStore()));
    registry.register(
      new TestConnector({
        nodes: [],
        edges: [],
      }),
    );

    expect(registry.listNames()).toEqual(["test"]);
  });

  it("persists sync output and records success metadata", async () => {
    const registry = createConnectorRegistry(new ConnectorRunner(new InMemoryGraphStore()));
    registry.register(
      new TestConnector({
        nodes: [
          {
            externalId: "event-1",
            kind: NodeKind.EVENT,
            label: "Planning",
          },
        ],
        edges: [
          {
            externalId: "edge-1",
            kind: EdgeKind.DEPENDS_ON,
            sourceExternalId: "event-1",
            targetExternalId: "event-1",
          },
        ],
      }),
    );

    const report = await registry.sync("user-1", "test");
    expect(report.ok).toBe(true);
    expect(report.nodesWritten).toBe(1);
    expect(report.edgesWritten).toBe(1);

    const status = registry.statuses("user-1")[0];
    expect(status?.lastSuccessAt).toBeDefined();
    expect(status?.lastError).toBeUndefined();
  });

  it("surfaces sync failures with error context", async () => {
    const registry = createConnectorRegistry(new ConnectorRunner(new InMemoryGraphStore()));
    registry.register(new TestConnector({ nodes: [], edges: [] }, true));

    const report = await registry.sync("user-1", "test");
    expect(report.ok).toBe(false);
    expect(report.error?.message).toBe("sync failed");

    const status = registry.statuses("user-1")[0];
    expect(status?.lastError?.message).toBe("sync failed");
    expect(status?.lastSuccessAt).toBeUndefined();
  });
});
