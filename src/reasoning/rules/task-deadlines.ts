import { NodeKind } from "../../graph/models.js";
import { asTaskNode } from "../../graph/tasks/parse.js";
import { TaskStatus } from "../../graph/tasks/protocol.js";
import { InsightKind } from "../types.js";
import type { ReasoningRule } from "./types.js";

const ACTIVE_STATUSES = new Set([TaskStatus.OPEN, TaskStatus.IN_PROGRESS]);

function parseTime(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function utcDayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function formatDueDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export const taskDeadlinesRule: ReasoningRule = {
  name: "task-deadlines",
  analyze({ snapshot, now }) {
    const insights = [];
    const nowMs = now.getTime();
    const todayKey = utcDayKey(nowMs);

    for (const node of snapshot.nodes) {
      if (node.kind !== NodeKind.TASK) continue;

      const taskNode = asTaskNode(node);
      if (!taskNode || !ACTIVE_STATUSES.has(taskNode.task.status)) continue;

      const dueMs = parseTime(taskNode.task.dueAt ?? node.endsAt);
      if (dueMs === undefined) continue;

      if (dueMs < nowMs) {
        insights.push({
          id: `task-overdue:${node.id}`,
          kind: InsightKind.DELAY,
          message: `Overdue: ${node.label} (due ${formatDueDate(dueMs)}).`,
          priority: 1,
          relatedNodeIds: [node.id],
        });
        continue;
      }

      if (utcDayKey(dueMs) === todayKey) {
        insights.push({
          id: `task-due-today:${node.id}`,
          kind: InsightKind.REMINDER,
          message: `Due today: ${node.label}.`,
          priority: 2,
          relatedNodeIds: [node.id],
        });
      }
    }

    return insights;
  },
};
