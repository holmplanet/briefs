/**
 * Brief — shared data contract for AI-generated snapshots.
 *
 * Briefs are synthesized from stitches (and past briefs) on `brief me`.
 * See brief.txt at repo root for the full schema reference.
 */

import { z } from "zod";

export const BRIEF_SCHEMA_VERSION = 1 as const;

export const BriefKind = {
  MORNING: "morning",
  ON_DEMAND: "on_demand",
  TRAVEL: "travel",
} as const;

export type BriefKind = (typeof BriefKind)[keyof typeof BriefKind];

const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "invalid ISO datetime" });

export const briefBulletSchema = z.object({
  text: z.string().min(1),
  priority: z.number().int().optional(),
});

export type BriefBullet = z.infer<typeof briefBulletSchema>;

export const briefSchema = z
  .object({
    schemaVersion: z.literal(BRIEF_SCHEMA_VERSION),
    id: z.string().uuid(),
    userId: z.string().min(1),
    kind: z.enum([BriefKind.MORNING, BriefKind.ON_DEMAND, BriefKind.TRAVEL]),
    generatedAt: isoDateTimeSchema,
    greeting: z.string().optional(),
    headline: z.string().optional(),
    bullets: z.array(briefBulletSchema),
    relatedStitchIds: z.array(z.string().uuid()),
    createdAt: isoDateTimeSchema,
  })
  .strict();

export type Brief = z.infer<typeof briefSchema>;

export const generateBriefInputSchema = z.object({
  kind: z.nativeEnum(BriefKind).optional(),
});

export type GenerateBriefInput = z.infer<typeof generateBriefInputSchema>;

export interface BriefStore {
  save(brief: Brief): Promise<Brief>;
  get(briefId: string): Promise<Brief | undefined>;
  listForUser(userId: string, limit?: number): Promise<Brief[]>;
  getLatestForUser(userId: string): Promise<Brief | undefined>;
  clear(): void;
}
