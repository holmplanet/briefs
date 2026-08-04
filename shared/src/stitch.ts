/**
 * Stitch — shared data contract for Briefs.
 *
 * Stitches are atomic items users capture; AI weaves them into briefs.
 * See stitch.txt at repo root for the full schema reference.
 */

import { z } from "zod";

export const STITCH_SCHEMA_VERSION = 1 as const;

export const StitchStatus = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  CANCELLED: "cancelled",
} as const;

export type StitchStatus = (typeof StitchStatus)[keyof typeof StitchStatus];

export const StitchPriority = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type StitchPriority = (typeof StitchPriority)[keyof typeof StitchPriority];

const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "invalid ISO datetime" });

export const stitchSchema = z
  .object({
    schemaVersion: z.literal(STITCH_SCHEMA_VERSION),
    id: z.string().uuid(),
    userId: z.string().min(1),
    label: z.string().min(1),
    status: z.enum([
      StitchStatus.OPEN,
      StitchStatus.IN_PROGRESS,
      StitchStatus.DONE,
      StitchStatus.CANCELLED,
    ]),
    dueAt: isoDateTimeSchema.optional(),
    scheduledAt: isoDateTimeSchema.optional(),
    completedAt: isoDateTimeSchema.optional(),
    priority: z
      .enum([StitchPriority.LOW, StitchPriority.NORMAL, StitchPriority.HIGH, StitchPriority.URGENT])
      .optional(),
    description: z.string().optional(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export type Stitch = z.infer<typeof stitchSchema>;

export const createStitchInputSchema = z.object({
  label: z.string().min(1),
  status: z.nativeEnum(StitchStatus).optional(),
  dueAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  priority: z.nativeEnum(StitchPriority).optional(),
  description: z.string().optional(),
});

export type CreateStitchInput = z.infer<typeof createStitchInputSchema>;

export const updateStitchInputSchema = z.object({
  label: z.string().min(1).optional(),
  status: z.nativeEnum(StitchStatus).optional(),
  dueAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  priority: z.nativeEnum(StitchPriority).nullable().optional(),
  description: z.string().nullable().optional(),
});

export type UpdateStitchInput = z.infer<typeof updateStitchInputSchema>;

export interface StitchStore {
  save(stitch: Stitch): Promise<Stitch>;
  get(stitchId: string): Promise<Stitch | undefined>;
  listForUser(userId: string, status?: StitchStatus): Promise<Stitch[]>;
  update(stitch: Stitch): Promise<Stitch>;
  delete(stitchId: string): Promise<boolean>;
  clear(): void;
}
