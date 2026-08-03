import { randomUUID } from "node:crypto";

import { BRIEF_TASKS_CONNECTOR_NAME } from "../connectors/personal/brief-tasks/connector.js";
import { getConnectorRegistry } from "../connectors/runtime.js";
import { TaskStatus } from "../graph/tasks/protocol.js";
import type { ConnectorSyncReport } from "../connectors/types.js";
import { getBriefTaskStore } from "./runtime.js";
import type { BriefTask, CreateBriefTaskInput, UpdateBriefTaskInput } from "./types.js";

export async function syncBriefTasks(userId: string): Promise<ConnectorSyncReport> {
  return getConnectorRegistry().sync(userId, BRIEF_TASKS_CONNECTOR_NAME);
}

export async function listBriefTasks(
  userId: string,
  status?: BriefTask["status"],
): Promise<BriefTask[]> {
  return getBriefTaskStore().listForUser(userId, status);
}

export async function createBriefTask(input: CreateBriefTaskInput): Promise<BriefTask> {
  const now = new Date().toISOString();
  const task: BriefTask = {
    id: randomUUID(),
    userId: input.userId,
    label: input.label.trim() || "Untitled task",
    status: input.status ?? TaskStatus.OPEN,
    dueAt: input.dueAt,
    scheduledAt: input.scheduledAt,
    priority: input.priority,
    description: input.description,
    createdAt: now,
    updatedAt: now,
  };

  await getBriefTaskStore().save(task);
  await syncBriefTasks(input.userId);
  return task;
}

export async function updateBriefTask(
  userId: string,
  taskId: string,
  input: UpdateBriefTaskInput,
): Promise<BriefTask> {
  const existing = await getBriefTaskStore().get(taskId);
  if (!existing || existing.userId !== userId) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const nextStatus = input.status ?? existing.status;
  const completedAt = resolveCompletedAt(existing, input, nextStatus);
  const now = new Date().toISOString();

  const updated: BriefTask = {
    ...existing,
    label: input.label?.trim() || existing.label,
    status: nextStatus,
    dueAt: input.dueAt === null ? undefined : (input.dueAt ?? existing.dueAt),
    scheduledAt:
      input.scheduledAt === null ? undefined : (input.scheduledAt ?? existing.scheduledAt),
    completedAt,
    priority: input.priority === null ? undefined : (input.priority ?? existing.priority),
    description:
      input.description === null ? undefined : (input.description ?? existing.description),
    updatedAt: now,
  };

  await getBriefTaskStore().update(updated);
  await syncBriefTasks(userId);
  return updated;
}

function resolveCompletedAt(
  existing: BriefTask,
  input: UpdateBriefTaskInput,
  nextStatus: BriefTask["status"],
): string | undefined {
  if (input.completedAt === null) {
    return undefined;
  }
  if (input.completedAt) {
    return input.completedAt;
  }
  if (nextStatus === TaskStatus.DONE && existing.status !== TaskStatus.DONE) {
    return new Date().toISOString();
  }
  if (nextStatus !== TaskStatus.DONE) {
    return undefined;
  }
  return existing.completedAt;
}
