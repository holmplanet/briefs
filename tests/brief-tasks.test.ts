import { describe, expect, it, vi } from "vitest";

import { BriefKind } from "../src/briefs/generator.js";
import { BRIEF_TASKS_CONNECTOR_NAME } from "../src/connectors/personal/brief-tasks/connector.js";
import { getConnectorRegistry } from "../src/connectors/runtime.js";
import { asTaskNode } from "../src/graph/tasks/parse.js";
import { NodeKind } from "../src/graph/models.js";
import { TaskPriority, TaskStatus } from "../src/graph/tasks/protocol.js";
import { getGraphStore } from "../src/graph/runtime.js";
import { generateBrief } from "../src/mcp/brief-service.js";
import {
  createBriefTask,
  listBriefTasks,
  syncBriefTasks,
  updateBriefTask,
} from "../src/tasks/service.js";

describe("brief-native tasks", () => {
  it("creates a task and syncs it into the graph with task protocol fields", async () => {
    const task = await createBriefTask({
      userId: "user-1",
      label: "Review task protocol",
      dueAt: "2026-08-05T17:00:00.000Z",
      priority: TaskPriority.HIGH,
      description: "Dogfood the connector",
    });

    expect(task.status).toBe(TaskStatus.OPEN);
    expect(task.id).toBeTruthy();

    const snapshot = await getGraphStore().getSnapshot("user-1");
    const graphTask = snapshot.nodes.find((node) => node.data.externalId === task.id);
    expect(graphTask?.kind).toBe(NodeKind.TASK);
    expect(graphTask?.label).toBe("Review task protocol");

    const parsed = asTaskNode(graphTask!);
    expect(parsed?.task.status).toBe(TaskStatus.OPEN);
    expect(parsed?.task.dueAt).toBe("2026-08-05T17:00:00.000Z");
    expect(parsed?.task.priority).toBe(TaskPriority.HIGH);
    expect(graphTask?.data.source).toBe("brief");
    expect(graphTask?.data.connector).toBe(BRIEF_TASKS_CONNECTOR_NAME);
  });

  it("lists tasks and updates status with auto completedAt", async () => {
    const created = await createBriefTask({
      userId: "user-1",
      label: "Ship brief tasks connector",
    });

    const openTasks = await listBriefTasks("user-1", TaskStatus.OPEN);
    expect(openTasks).toHaveLength(1);

    const updated = await updateBriefTask("user-1", created.id, {
      status: TaskStatus.DONE,
    });

    expect(updated.status).toBe(TaskStatus.DONE);
    expect(updated.completedAt).toBeTruthy();

    const doneTasks = await listBriefTasks("user-1", TaskStatus.DONE);
    expect(doneTasks).toHaveLength(1);
  });

  it("rejects updates for tasks owned by another user", async () => {
    const task = await createBriefTask({
      userId: "user-1",
      label: "Private task",
    });

    await expect(
      updateBriefTask("user-2", task.id, { label: "Hijacked" }),
    ).rejects.toThrow(/not found/i);
  });

  it("syncs through the brief-tasks connector", async () => {
    await createBriefTask({
      userId: "user-1",
      label: "Sync me",
    });

    const report = await syncBriefTasks("user-1");
    expect(report.ok).toBe(true);
    expect(report.connector).toBe(BRIEF_TASKS_CONNECTOR_NAME);
    expect(report.nodesWritten).toBe(1);
  });

  it("registers the brief-tasks connector", () => {
    expect(getConnectorRegistry().listNames()).toContain(BRIEF_TASKS_CONNECTOR_NAME);
  });

  it("surfaces overdue tasks in brief_me bullets", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-01T12:00:00.000Z"));

    try {
      await createBriefTask({
        userId: "user-1",
        label: "Overdue spec review",
        dueAt: "2026-07-31T17:00:00.000Z",
        priority: TaskPriority.HIGH,
      });

      const brief = await generateBrief("user-1", BriefKind.ON_DEMAND, { syncFirst: false });
      expect(brief.bullets.some((bullet) => bullet.text.includes("Overdue spec review"))).toBe(
        true,
      );
      expect(brief.bullets.some((bullet) => bullet.text.includes("Overdue:"))).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
