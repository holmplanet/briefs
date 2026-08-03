import type { TaskPriority, TaskStatus } from "../graph/tasks/protocol.js";

export type BriefTask = {
  id: string;
  userId: string;
  label: string;
  status: TaskStatus;
  dueAt?: string;
  scheduledAt?: string;
  completedAt?: string;
  priority?: TaskPriority;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBriefTaskInput = {
  userId: string;
  label: string;
  status?: TaskStatus;
  dueAt?: string;
  scheduledAt?: string;
  priority?: TaskPriority;
  description?: string;
};

export type UpdateBriefTaskInput = {
  label?: string;
  status?: TaskStatus;
  dueAt?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  priority?: TaskPriority | null;
  description?: string | null;
};

export interface BriefTaskStore {
  save(task: BriefTask): Promise<BriefTask>;
  get(taskId: string): Promise<BriefTask | undefined>;
  listForUser(userId: string, status?: TaskStatus): Promise<BriefTask[]>;
  update(task: BriefTask): Promise<BriefTask>;
  delete(taskId: string): Promise<boolean>;
  clear(): void;
}
