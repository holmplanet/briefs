import { beforeEach, describe, expect, it } from "vitest";

import { briefStore } from "../src/briefs/store.js";
import { generateBrief, generateDeltaBrief } from "../src/mcp/brief-service.js";
import { BriefKind } from "../src/briefs/generator.js";
import { InsightKind } from "../src/reasoning/engine.js";
import {
  ConnectorPack,
  ConnectorRunner,
  ReadOnlyConnector,
  createConnectorRegistry,
} from "../src/connectors/index.js";
import { BriefTasksConnector } from "../src/connectors/personal/brief-tasks/connector.js";
import { getConnectorRegistry, resetConnectorRegistry, setConnectorRegistry } from "../src/connectors/runtime.js";
import { InMemoryGraphStore } from "../src/graph/memory-store.js";
import { resetGraphStore, setGraphStore } from "../src/graph/runtime.js";
import { InMemoryBriefTaskStore } from "../src/tasks/memory-store.js";
import { resetBriefTaskRuntime, setBriefTaskStore } from "../src/tasks/runtime.js";
import { NodeKind } from "../src/graph/models.js";
import type { NormalizedSyncPayload } from "../src/connectors/types.js";

class MutableConnector extends ReadOnlyConnector {
  readonly definition = {
    name: "fixture",
    pack: ConnectorPack.PERSONAL,
    description: "Fixture connector",
    readOnly: true,
  };

  constructor(private payload: NormalizedSyncPayload) {
    super();
  }

  setPayload(payload: NormalizedSyncPayload): void {
    this.payload = payload;
  }

  async fetch(): Promise<NormalizedSyncPayload> {
    return this.payload;
  }
}

describe("what_changed delta brief", () => {
  let connector: MutableConnector;
  let store: InMemoryGraphStore;

  beforeEach(() => {
    resetGraphStore();
    resetConnectorRegistry();
    resetBriefTaskRuntime();
    briefStore.clear();

    store = new InMemoryGraphStore();
    setGraphStore(store);
    setBriefTaskStore(new InMemoryBriefTaskStore());

    const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    connector = new MutableConnector({
      nodes: [
        {
          externalId: "event-1",
          kind: NodeKind.EVENT,
          label: "Standup",
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
        },
      ],
      edges: [],
    });

    const registry = createConnectorRegistry(new ConnectorRunner(store));
    registry.register(new BriefTasksConnector());
    registry.register(connector);
    setConnectorRegistry(registry);
  });

  it("returns only new insights compared to the previous brief", async () => {
    await getConnectorRegistry().sync("user-1", "fixture");
    const first = await generateBrief("user-1", BriefKind.ON_DEMAND, { syncFirst: false });
    expect(first.bullets.some((bullet) => bullet.text.includes("Standup"))).toBe(true);

    const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const overlapStart = new Date(start.getTime() + 15 * 60 * 1000);
    const overlapEnd = new Date(start.getTime() + 60 * 60 * 1000);

    connector.setPayload({
      nodes: [
        {
          externalId: "event-1",
          kind: NodeKind.EVENT,
          label: "Standup",
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
        },
        {
          externalId: "event-2",
          kind: NodeKind.EVENT,
          label: "Client call",
          startsAt: overlapStart.toISOString(),
          endsAt: overlapEnd.toISOString(),
        },
      ],
      edges: [],
    });

    await getConnectorRegistry().sync("user-1", "fixture");
    const delta = await generateDeltaBrief("user-1");
    expect(delta.previousBriefAt).toBe(first.generatedAt);
    expect(delta.brief.bullets.some((bullet) => bullet.text.includes("Client call"))).toBe(true);
  });

  it("reports no changes when the graph is unchanged", async () => {
    await getConnectorRegistry().sync("user-1", "fixture");
    await generateBrief("user-1", BriefKind.ON_DEMAND, { syncFirst: false });
    const delta = await generateDeltaBrief("user-1");

    expect(delta.brief.bullets).toHaveLength(1);
    expect(delta.brief.bullets[0]?.text).toContain("No new changes");
    expect(delta.changeSet.insights[0]?.kind).toBe(InsightKind.MISSING_INFO);
  });
});
