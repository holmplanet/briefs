import { randomUUID } from "node:crypto";

import {
  TaskStatus,
  type CreateTaskNodeInput,
  type TaskNode,
  type TaskNodeStore,
  type TaskStatus as TaskStatusType,
  type UpdateTaskNodeInput,
} from "@brief/shared";

export class PersonalTaskService {
  constructor(private readonly store: TaskNodeStore) {}

  list(userId: string, status?: TaskStatusType): Promise<TaskNode[]> {
    return this.store.listForUser(userId, status);
  }

  async create(userId: string, input: CreateTaskNodeInput): Promise<TaskNode> {
    const now = new Date().toISOString();
    const task: TaskNode = {
      schemaVersion: 1,
      id: randomUUID(),
      userId,
      label: input.label.trim(),
      status: input.status ?? TaskStatus.OPEN,
      dueAt: input.dueAt,
      scheduledAt: input.scheduledAt,
      priority: input.priority,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    };

    await this.store.save(task);
    return task;
  }

  async update(userId: string, taskId: string, input: UpdateTaskNodeInput): Promise<TaskNode> {
    const existing = await this.store.get(taskId);
    if (!existing || existing.userId !== userId) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const nextStatus = input.status ?? existing.status;
    const completedAt = resolveCompletedAt(existing, input, nextStatus);
    const now = new Date().toISOString();

    const updated: TaskNode = {
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

    await this.store.update(updated);
    return updated;
  }
}

function resolveCompletedAt(
  existing: TaskNode,
  input: UpdateTaskNodeInput,
  nextStatus: TaskStatusType,
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
