import { randomUUID } from "node:crypto";

import type { Brief, BriefCreateInput } from "@briefs/shared/brief";

import type { BriefStore } from "./store.js";

export class BriefService {
  constructor(private readonly store: BriefStore) {}

  list(userId: string, limit?: number): Promise<Brief[]> {
    return this.store.listForUser(userId, limit);
  }

  get(userId: string, briefId: string): Promise<Brief | undefined> {
    return this.store.get(userId, briefId);
  }

  create(userId: string, input: BriefCreateInput): Promise<Brief> {
    const brief: Brief = {
      schemaVersion: 1,
      id: randomUUID(),
      userId,
      kind: input.kind,
      headline: input.headline.trim(),
      summary: input.summary.trim(),
      itemIds: input.itemIds,
      createdAt: new Date().toISOString(),
    };
    return this.store.save(brief);
  }
}
