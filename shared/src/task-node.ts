/**
 * TaskNode — shared data contract for Brief.
 *
 * Single source of truth imported by `@brief/system` (serves it) and client packages
 * (render or extend it). See tasknode.txt at repo root for the full schema reference.
 */

import { z } from "zod";

export const TASK_NODE_SCHEMA_VERSION = 1 as const;

export const TaskStatus = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  CANCELLED: "cancelled",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "invalid ISO datetime" });

export const taskNodeSchema = z
  .object({
    schemaVersion: z.literal(TASK_NODE_SCHEMA_VERSION),
    id: z.string().uuid(),
    userId: z.string().min(1),
    label: z.string().min(1),
    status: z.enum([
      TaskStatus.OPEN,
      TaskStatus.IN_PROGRESS,
      TaskStatus.DONE,
      TaskStatus.CANCELLED,
    ]),
    dueAt: isoDateTimeSchema.optional(),
    scheduledAt: isoDateTimeSchema.optional(),
    completedAt: isoDateTimeSchema.optional(),
    priority: z
      .enum([TaskPriority.LOW, TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT])
      .optional(),
    description: z.string().optional(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export type TaskNode = z.infer<typeof taskNodeSchema>;

export const createTaskNodeInputSchema = z.object({
  label: z.string().min(1),
  status: z.nativeEnum(TaskStatus).optional(),
  dueAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  description: z.string().optional(),
});

export type CreateTaskNodeInput = z.infer<typeof createTaskNodeInputSchema>;

export const updateTaskNodeInputSchema = z.object({
  label: z.string().min(1).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  priority: z.nativeEnum(TaskPriority).nullable().optional(),
  description: z.string().nullable().optional(),
});

export type UpdateTaskNodeInput = z.infer<typeof updateTaskNodeInputSchema>;

export interface TaskNodeStore {
  save(task: TaskNode): Promise<TaskNode>;
  get(taskId: string): Promise<TaskNode | undefined>;
  listForUser(userId: string, status?: TaskStatus): Promise<TaskNode[]>;
  update(task: TaskNode): Promise<TaskNode>;
  delete(taskId: string): Promise<boolean>;
  clear(): void;
}
