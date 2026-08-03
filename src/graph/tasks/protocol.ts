import { z } from "zod";

export const TASK_PROTOCOL_VERSION = 1 as const;

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

export const taskProtocolV1Schema = z
  .object({
    schemaVersion: z.literal(TASK_PROTOCOL_VERSION),
    status: z.enum([
      TaskStatus.OPEN,
      TaskStatus.IN_PROGRESS,
      TaskStatus.DONE,
      TaskStatus.CANCELLED,
    ]),
    dueAt: isoDateTimeSchema.optional(),
    completedAt: isoDateTimeSchema.optional(),
    priority: z
      .enum([TaskPriority.LOW, TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT])
      .optional(),
  })
  .strict();

export type TaskProtocolV1 = z.infer<typeof taskProtocolV1Schema>;

export const TASK_PROTOCOL_FIELDS = [
  "schemaVersion",
  "status",
  "dueAt",
  "completedAt",
  "priority",
] as const satisfies ReadonlyArray<keyof TaskProtocolV1>;
