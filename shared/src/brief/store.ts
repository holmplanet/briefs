import type { Brief } from "./schema.js";

export interface BriefStore {
  save(brief: Brief): Promise<Brief>;
  get(briefId: string): Promise<Brief | undefined>;
  listForUser(userId: string, limit?: number): Promise<Brief[]>;
  getLatestForUser(userId: string): Promise<Brief | undefined>;
  clear(): void;
}
