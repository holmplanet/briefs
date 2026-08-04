import { z } from "zod";

import { StitchPriority, StitchStatus } from "./constants.js";

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
