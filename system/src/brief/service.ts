import { randomUUID } from "node:crypto";

import {
  BriefKind,
  type Brief,
  type BriefStore,
  type GenerateBriefInput,
} from "@briefs/shared/brief";

import type { StitchService } from "../stitch/service.js";
import { buildBriefContent } from "./generator.js";

export class BriefService {
  constructor(
    private readonly store: BriefStore,
    private readonly stitches: StitchService,
  ) {}

  list(userId: string, limit?: number): Promise<Brief[]> {
    return this.store.listForUser(userId, limit);
  }

  async get(userId: string, briefId: string): Promise<Brief> {
    const brief = await this.store.get(briefId);
    if (!brief || brief.userId !== userId) {
      throw new Error(`Brief not found: ${briefId}`);
    }
    return brief;
  }

  async generate(userId: string, input: GenerateBriefInput = {}): Promise<Brief> {
    const kind = input.kind ?? BriefKind.ON_DEMAND;
    const allStitches = await this.stitches.list(userId);
    const previousBrief = await this.store.getLatestForUser(userId);
    const now = new Date().toISOString();

    const { bullets, relatedStitchIds, headline, greeting } = buildBriefContent({
      kind,
      stitches: allStitches,
      previousBrief,
    });

    const brief: Brief = {
      schemaVersion: 1,
      id: randomUUID(),
      userId,
      kind,
      generatedAt: now,
      greeting,
      headline,
      bullets,
      relatedStitchIds,
      createdAt: now,
    };

    await this.store.save(brief);
    return brief;
  }
}
