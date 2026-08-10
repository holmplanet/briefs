import { randomUUID } from "node:crypto";

import type { Pool } from "pg";

import type { Brief } from "@briefs/shared/brief";

export type BriefStore = {
  save(brief: Brief): Promise<Brief>;
  get(userId: string, briefId: string): Promise<Brief | undefined>;
  listForUser(userId: string, limit?: number): Promise<Brief[]>;
};

export class MemoryBriefStore implements BriefStore {
  private readonly briefs = new Map<string, Brief>();

  async save(brief: Brief): Promise<Brief> {
    this.briefs.set(brief.id, brief);
    return brief;
  }

  async get(userId: string, briefId: string): Promise<Brief | undefined> {
    const brief = this.briefs.get(briefId);
    return brief?.userId === userId ? brief : undefined;
  }

  async listForUser(userId: string, limit = 20): Promise<Brief[]> {
    return [...this.briefs.values()]
      .filter((brief) => brief.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}

type BriefRow = {
  id: string;
  user_id: string;
  kind: Brief["kind"];
  headline: string;
  summary: string;
  item_ids: string[];
  created_at: Date;
};

function mapRow(row: BriefRow): Brief {
  return {
    schemaVersion: 1,
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    headline: row.headline,
    summary: row.summary,
    itemIds: row.item_ids,
    createdAt: row.created_at.toISOString(),
  };
}

export class PostgresBriefStore implements BriefStore {
  constructor(private readonly pool: Pool) {}

  async save(brief: Brief): Promise<Brief> {
    await this.pool.query(
      `INSERT INTO briefs (id, user_id, kind, headline, summary, item_ids, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [brief.id, brief.userId, brief.kind, brief.headline, brief.summary, JSON.stringify(brief.itemIds), brief.createdAt],
    );
    return brief;
  }

  async get(userId: string, briefId: string): Promise<Brief | undefined> {
    const result = await this.pool.query<BriefRow>(
      `SELECT id, user_id, kind, headline, summary, item_ids, created_at FROM briefs WHERE id = $1 AND user_id = $2`,
      [briefId, userId],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : undefined;
  }

  async listForUser(userId: string, limit = 20): Promise<Brief[]> {
    const result = await this.pool.query<BriefRow>(
      `SELECT id, user_id, kind, headline, summary, item_ids, created_at
       FROM briefs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return result.rows.map(mapRow);
  }
}
