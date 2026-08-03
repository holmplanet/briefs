import { describe, expect, it } from "vitest";

import { EdgeKind, NodeKind } from "../src/graph/models.js";
import { TaskStatus } from "../src/graph/tasks/protocol.js";
import { analyzeGraph } from "../src/reasoning/analyze.js";
import { diffInsights } from "../src/reasoning/diff.js";
import { InsightKind } from "../src/reasoning/engine.js";
import { buildReasoningContext, getLastSyncAt } from "../src/reasoning/context.js";
import { connectorStatusStore } from "../src/connectors/status.js";
import { ReasoningRuleRegistry } from "../src/reasoning/rules/registry.js";
import { weatherConflictsRule } from "../src/reasoning/rules/weather-conflicts.js";

const now = new Date("2026-08-01T12:00:00.000Z");
const syncedAt = now.toISOString();

function eventNode(
  id: string,
  label: string,
  startsAt: string,
  endsAt: string,
  updatedAt = syncedAt,
) {
  return {
    id,
    userId: "user-1",
    kind: NodeKind.EVENT,
    label,
    data: { externalId: id },
    startsAt,
    endsAt,
    updatedAt,
  };
}

function weatherNode(id: string, label: string, startsAt: string, endsAt: string) {
  return {
    id,
    userId: "user-1",
    kind: NodeKind.WEATHER,
    label,
    data: { summary: "Rain", precipitationProbability: 80 },
    startsAt,
    endsAt,
    updatedAt: syncedAt,
  };
}

function taskNode(
  id: string,
  label: string,
  dueAt: string,
  status: (typeof TaskStatus)[keyof typeof TaskStatus] = TaskStatus.OPEN,
) {
  return {
    id,
    userId: "user-1",
    kind: NodeKind.TASK,
    label,
    data: {
      schemaVersion: 1,
      status,
      dueAt,
      externalId: id,
    },
    endsAt: dueAt,
    updatedAt: syncedAt,
  };
}

describe("reasoning engine", () => {
  it("detects meeting and weather conflict from the vision example", () => {
    const snapshot = {
      userId: "user-1",
      syncedAt,
      nodes: [
        eventNode("event-1", "2 PM meeting", "2026-08-01T18:00:00.000Z", "2026-08-01T19:00:00.000Z"),
        weatherNode(
          "wx-1",
          "Rain (80% precip)",
          "2026-08-01T17:00:00.000Z",
          "2026-08-01T19:00:00.000Z",
        ),
      ],
      edges: [
        {
          id: "edge-1",
          userId: "user-1",
          kind: EdgeKind.DEPENDS_ON,
          sourceId: "event-1",
          targetId: "wx-1",
          data: {},
          updatedAt: syncedAt,
        },
      ],
    };

    const changes = analyzeGraph(snapshot, { now });
    expect(changes.insights).toHaveLength(1);
    expect(changes.insights[0]?.kind).toBe(InsightKind.CONFLICT);
    expect(changes.insights[0]?.message).toContain("2 PM meeting");
    expect(changes.insights[0]?.message.toLowerCase()).toContain("weather");
  });

  it("detects overlapping calendar events", () => {
    const snapshot = {
      userId: "user-1",
      syncedAt,
      nodes: [
        eventNode("event-1", "Standup", "2026-08-01T14:00:00.000Z", "2026-08-01T14:30:00.000Z"),
        eventNode("event-2", "Client call", "2026-08-01T14:15:00.000Z", "2026-08-01T15:00:00.000Z"),
      ],
      edges: [],
    };

    const changes = analyzeGraph(snapshot, { now });
    expect(changes.insights.some((insight) => insight.id.startsWith("schedule-conflict:"))).toBe(
      true,
    );
    expect(changes.insights[0]?.message).toContain("Standup");
    expect(changes.insights[0]?.message).toContain("Client call");
  });

  it("detects overdue tasks", () => {
    const snapshot = {
      userId: "user-1",
      syncedAt,
      nodes: [taskNode("task-1", "Review PR", "2026-07-31T17:00:00.000Z")],
      edges: [],
    };

    const changes = analyzeGraph(snapshot, { now });
    expect(changes.insights).toHaveLength(1);
    expect(changes.insights[0]?.kind).toBe(InsightKind.DELAY);
    expect(changes.insights[0]?.message).toContain("Overdue");
    expect(changes.insights[0]?.message).toContain("Review PR");
  });

  it("detects tasks due today", () => {
    const snapshot = {
      userId: "user-1",
      syncedAt,
      nodes: [taskNode("task-1", "Ship connector", "2026-08-01T20:00:00.000Z")],
      edges: [],
    };

    const changes = analyzeGraph(snapshot, { now });
    expect(changes.insights).toHaveLength(1);
    expect(changes.insights[0]?.kind).toBe(InsightKind.REMINDER);
    expect(changes.insights[0]?.message).toContain("Due today");
    expect(changes.insights[0]?.message).toContain("Ship connector");
  });

  it("ignores completed and cancelled tasks", () => {
    const snapshot = {
      userId: "user-1",
      syncedAt,
      nodes: [
        taskNode("task-1", "Done task", "2026-07-31T17:00:00.000Z", TaskStatus.DONE),
        taskNode("task-2", "Cancelled task", "2026-07-31T17:00:00.000Z", TaskStatus.CANCELLED),
      ],
      edges: [],
    };

    const changes = analyzeGraph(snapshot, { now });
    expect(changes.insights.some((insight) => insight.id.startsWith("task-"))).toBe(false);
  });

  it("flags stale waiting_on dependencies", () => {
    const staleUpdatedAt = "2026-07-20T12:00:00.000Z";
    const snapshot = {
      userId: "user-1",
      syncedAt,
      nodes: [
        {
          id: "person-1",
          userId: "user-1",
          kind: NodeKind.PERSON,
          label: "John",
          data: {},
          updatedAt: syncedAt,
        },
        {
          id: "approval-1",
          userId: "user-1",
          kind: NodeKind.TASK,
          label: "Inbox approval",
          data: {},
          updatedAt: staleUpdatedAt,
        },
      ],
      edges: [
        {
          id: "edge-1",
          userId: "user-1",
          kind: EdgeKind.WAITING_ON,
          sourceId: "person-1",
          targetId: "approval-1",
          data: {},
          updatedAt: syncedAt,
        },
      ],
    };

    const changes = analyzeGraph(snapshot, { now });
    expect(changes.insights).toHaveLength(1);
    expect(changes.insights[0]?.kind).toBe(InsightKind.DELAY);
    expect(changes.insights[0]?.message).toContain("stale");
    expect(changes.insights[0]?.message).toContain("John");
  });

  it("includes last sync metadata in the change set", () => {
    connectorStatusStore.recordSuccess("user-1", "google-calendar", 1, 0, "2026-08-01T11:00:00.000Z");
    connectorStatusStore.recordSuccess("user-1", "weather", 2, 1, "2026-08-01T11:30:00.000Z");

    const snapshot = {
      userId: "user-1",
      syncedAt,
      nodes: [
        eventNode(
          "event-1",
          "Later meeting",
          "2026-08-02T14:00:00.000Z",
          "2026-08-02T15:00:00.000Z",
        ),
      ],
      edges: [],
    };

    const changes = analyzeGraph(snapshot, { now });
    expect(getLastSyncAt("user-1")).toBe("2026-08-01T11:30:00.000Z");
    expect(changes.lastSyncAt).toBe("2026-08-01T11:30:00.000Z");
    connectorStatusStore.clear();
  });

  it("diffs insights against a previous brief change set", () => {
    const previous = [
      {
        id: "upcoming-event:event-1",
        kind: InsightKind.REMINDER,
        message: "Upcoming: Standup",
        priority: 3,
        relatedNodeIds: ["event-1"],
      },
    ];

    const current = [
      ...previous,
      {
        id: "schedule-conflict:event-1:event-2",
        kind: InsightKind.CONFLICT,
        message: "“Standup” overlaps with “Client call”.",
        priority: 1,
        relatedNodeIds: ["event-1", "event-2"],
      },
    ];

    const delta = diffInsights(previous, current);
    expect(delta).toHaveLength(1);
    expect(delta[0]?.id).toBe("schedule-conflict:event-1:event-2");
  });

  it("allows vertical packs to register additional rules", () => {
    const registry = new ReasoningRuleRegistry([weatherConflictsRule]);

    registry.register({
      name: "fixture-vertical-rule",
      analyze: () => [
        {
          id: "vertical-opportunity",
          kind: InsightKind.OPPORTUNITY,
          message: "Charter window looks strong this afternoon.",
          priority: 2,
          relatedNodeIds: [],
        },
      ],
    });

    expect(registry.list()).toHaveLength(2);
  });

  it("passes since timestamp through reasoning context", () => {
    const snapshot = {
      userId: "user-1",
      syncedAt,
      nodes: [
        eventNode(
          "event-1",
          "Later today",
          "2026-08-01T20:00:00.000Z",
          "2026-08-01T21:00:00.000Z",
        ),
      ],
      edges: [],
    };

    const context = buildReasoningContext(snapshot, {
      now,
      since: "2026-08-01T10:00:00.000Z",
    });
    expect(context.since).toBe("2026-08-01T10:00:00.000Z");
  });
});
