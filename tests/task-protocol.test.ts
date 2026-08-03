import { describe, expect, it } from "vitest";

import { mapPayloadToGraph } from "../src/connectors/types.js";
import { EdgeKind, NodeKind } from "../src/graph/models.js";
import {
  TaskPriority,
  TaskStatus,
  asTaskNode,
  buildTaskEdge,
  buildTaskNode,
  isTaskNode,
  parseTaskProtocol,
} from "../src/graph/tasks/index.js";

describe("task protocol", () => {
  it("builds a normalized task node with protocol fields", () => {
    const node = buildTaskNode({
      externalId: "task-1",
      label: "Review PR",
      status: TaskStatus.IN_PROGRESS,
      dueAt: "2026-08-05T17:00:00.000Z",
      priority: TaskPriority.HIGH,
      source: "github-issues",
      url: "https://github.com/holmplanet/brief/issues/1",
    });

    expect(node.kind).toBe(NodeKind.TASK);
    expect(node.label).toBe("Review PR");
    expect(node.endsAt).toBe("2026-08-05T17:00:00.000Z");
    expect(node.data).toMatchObject({
      schemaVersion: 1,
      status: TaskStatus.IN_PROGRESS,
      dueAt: "2026-08-05T17:00:00.000Z",
      priority: TaskPriority.HIGH,
      source: "github-issues",
      url: "https://github.com/holmplanet/brief/issues/1",
    });
  });

  it("defaults status to open", () => {
    const node = buildTaskNode({
      externalId: "task-2",
      label: "Untitled",
    });

    expect(node.data.status).toBe(TaskStatus.OPEN);
    expect(node.data.schemaVersion).toBe(1);
  });

  it("maps through connector graph layer with connector metadata", () => {
    const result = mapPayloadToGraph("user-1", "brief", {
      nodes: [
        buildTaskNode({
          externalId: "task-1",
          label: "Dogfood task protocol",
          dueAt: "2026-08-05T17:00:00.000Z",
          source: "brief",
        }),
      ],
      edges: [],
    });

    const stored = result.nodes[0];
    expect(stored?.kind).toBe(NodeKind.TASK);
    expect(stored?.data.connector).toBe("brief");
    expect(stored?.data.externalId).toBe("task-1");
    expect(stored?.data.schemaVersion).toBe(1);
  });

  it("parses task protocol from graph nodes", () => {
    const built = mapPayloadToGraph("user-1", "brief", {
      nodes: [
        buildTaskNode({
          externalId: "task-1",
          label: "Ship v1",
          status: TaskStatus.DONE,
          completedAt: "2026-08-01T12:00:00.000Z",
        }),
      ],
      edges: [],
    });

    const node = built.nodes[0];
    expect(node).toBeDefined();
    expect(isTaskNode(node!)).toBe(true);

    const taskNode = asTaskNode(node!);
    expect(taskNode?.task.status).toBe(TaskStatus.DONE);
    expect(taskNode?.task.completedAt).toBe("2026-08-01T12:00:00.000Z");
  });

  it("parses legacy nodes with missing schemaVersion", () => {
    const parsed = parseTaskProtocol({
      status: TaskStatus.OPEN,
      connector: "legacy",
      externalId: "x",
    });

    expect(parsed).toEqual({
      schemaVersion: 1,
      status: TaskStatus.OPEN,
    });
  });

  it("rejects invalid protocol data", () => {
    expect(parseTaskProtocol({ schemaVersion: 1, status: "paused" })).toBeNull();
    expect(parseTaskProtocol({ schemaVersion: 2, status: TaskStatus.OPEN })).toBeNull();
  });

  it("builds task relationship edges", () => {
    const edge = buildTaskEdge({
      externalId: "edge-1",
      kind: EdgeKind.BLOCKED_BY,
      sourceExternalId: "task-a",
      targetExternalId: "task-b",
      reason: "approval_pending",
    });

    expect(edge.kind).toBe(EdgeKind.BLOCKED_BY);
    expect(edge.sourceExternalId).toBe("task-a");
    expect(edge.data.reason).toBe("approval_pending");
  });
});
