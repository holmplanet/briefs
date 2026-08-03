import { describe, expect, it, vi } from "vitest";

import { EdgeKind, NodeKind } from "../src/graph/models.js";
import { asTaskNode } from "../src/graph/tasks/parse.js";
import { TaskStatus } from "../src/graph/tasks/protocol.js";
import { getGraphStore } from "../src/graph/runtime.js";
import { ingestContext } from "../src/mcp/ingest-service.js";
import { generateBrief } from "../src/mcp/brief-service.js";
import { BriefKind } from "../src/briefs/generator.js";

describe("ingest_context", () => {
  it("writes agent-ingested nodes into the graph", async () => {
    const report = await ingestContext({
      userId: "user-1",
      source: "cursor-google-calendar",
      nodes: [
        {
          externalId: "evt-1",
          kind: NodeKind.EVENT,
          label: "Outdoor standup",
          startsAt: "2026-08-01T18:00:00.000Z",
          endsAt: "2026-08-01T19:00:00.000Z",
        },
      ],
      edges: [],
    });

    expect(report.nodesWritten).toBe(1);
    expect(report.source).toBe("cursor-google-calendar");

    const snapshot = await getGraphStore().getSnapshot("user-1");
    const event = snapshot.nodes.find((node) => node.data.externalId === "evt-1");
    expect(event?.label).toBe("Outdoor standup");
    expect(event?.data.connector).toBe("cursor-google-calendar");
  });

  it("updates existing nodes on re-ingest with the same source and externalId", async () => {
    await ingestContext({
      userId: "user-1",
      source: "github-issues",
      nodes: [
        {
          externalId: "gh-16",
          kind: NodeKind.TASK,
          label: "Task protocol v1",
          endsAt: "2026-08-05T17:00:00.000Z",
          data: {
            schemaVersion: 1,
            status: TaskStatus.OPEN,
            dueAt: "2026-08-05T17:00:00.000Z",
          },
        },
      ],
      edges: [],
    });

    const first = await getGraphStore().getSnapshot("user-1");
    const firstId = first.nodes.find((n) => n.data.externalId === "gh-16")?.id;

    await ingestContext({
      userId: "user-1",
      source: "github-issues",
      nodes: [
        {
          externalId: "gh-16",
          kind: NodeKind.TASK,
          label: "Task protocol v1 — done",
          endsAt: "2026-08-05T17:00:00.000Z",
          data: {
            schemaVersion: 1,
            status: TaskStatus.DONE,
            dueAt: "2026-08-05T17:00:00.000Z",
            completedAt: "2026-08-03T12:00:00.000Z",
          },
        },
      ],
      edges: [],
    });

    const second = await getGraphStore().getSnapshot("user-1");
    const updated = second.nodes.find((n) => n.data.externalId === "gh-16");
    expect(updated?.id).toBe(firstId);
    expect(updated?.label).toBe("Task protocol v1 — done");
    expect(asTaskNode(updated!)?.task.status).toBe(TaskStatus.DONE);
  });

  it("writes edges between ingested nodes", async () => {
    await ingestContext({
      userId: "user-1",
      source: "agent-test",
      nodes: [
        {
          externalId: "event-1",
          kind: NodeKind.EVENT,
          label: "Meeting",
          startsAt: "2026-08-01T18:00:00.000Z",
          endsAt: "2026-08-01T19:00:00.000Z",
        },
        {
          externalId: "wx-1",
          kind: NodeKind.WEATHER,
          label: "Rain",
          startsAt: "2026-08-01T17:00:00.000Z",
          endsAt: "2026-08-01T19:00:00.000Z",
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
    });

    const snapshot = await getGraphStore().getSnapshot("user-1");
    expect(snapshot.edges).toHaveLength(1);
    expect(snapshot.edges[0]?.kind).toBe(EdgeKind.DEPENDS_ON);
  });

  it("feeds ingested context into brief_me reasoning", async () => {
    const now = new Date("2026-08-01T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    try {
      await ingestContext({
        userId: "user-1",
        source: "cursor-google-calendar",
        nodes: [
          {
            externalId: "evt-1",
            kind: NodeKind.EVENT,
            label: "Later today",
            startsAt: "2026-08-01T20:00:00.000Z",
            endsAt: "2026-08-01T21:00:00.000Z",
          },
        ],
        edges: [],
      });

      const brief = await generateBrief("user-1", BriefKind.ON_DEMAND, { syncFirst: false });
      expect(brief.bullets.some((b) => b.text.includes("Later today"))).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
