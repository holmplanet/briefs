import type { Pool } from "pg";

import type { Brief, BriefBullet, BriefKind, BriefStore } from "@briefs/shared";

type BriefRow = {
  id: string;
  user_id: string;
  kind: BriefKind;
  generated_at: Date;
  greeting: string | null;
  headline: string | null;
  bullets: BriefBullet[];
  related_stitch_ids: string[];
  created_at: Date;
};

function mapRow(row: BriefRow): Brief {
  return {
    schemaVersion: 1,
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    generatedAt: row.generated_at.toISOString(),
    greeting: row.greeting ?? undefined,
    headline: row.headline ?? undefined,
    bullets: row.bullets,
    relatedStitchIds: row.related_stitch_ids,
    createdAt: row.created_at.toISOString(),
  };
}

export class PostgresBriefStore implements BriefStore {
  constructor(private readonly pool: Pool) {}

  async save(brief: Brief): Promise<Brief> {
    await this.pool.query(
      `INSERT INTO briefs (
         id, user_id, kind, generated_at, greeting, headline,
         bullets, related_stitch_ids, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        brief.id,
        brief.userId,
        brief.kind,
        brief.generatedAt,
        brief.greeting ?? null,
        brief.headline ?? null,
        JSON.stringify(brief.bullets),
        brief.relatedStitchIds,
        brief.createdAt,
      ],
    );
    return brief;
  }

  async get(briefId: string): Promise<Brief | undefined> {
    const result = await this.pool.query<BriefRow>(
      `SELECT id, user_id, kind, generated_at, greeting, headline,
              bullets, related_stitch_ids, created_at
       FROM briefs
       WHERE id = $1`,
      [briefId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  async listForUser(userId: string, limit = 20): Promise<Brief[]> {
    const result = await this.pool.query<BriefRow>(
      `SELECT id, user_id, kind, generated_at, greeting, headline,
              bullets, related_stitch_ids, created_at
       FROM briefs
       WHERE user_id = $1
       ORDER BY generated_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows.map(mapRow);
  }

  async getLatestForUser(userId: string): Promise<Brief | undefined> {
    const result = await this.pool.query<BriefRow>(
      `SELECT id, user_id, kind, generated_at, greeting, headline,
              bullets, related_stitch_ids, created_at
       FROM briefs
       WHERE user_id = $1
       ORDER BY generated_at DESC
       LIMIT 1`,
      [userId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  clear(): void {
    throw new Error("PostgresBriefStore.clear() is not supported");
  }
}

export class MemoryBriefStore implements BriefStore {
  private readonly briefs = new Map<string, Brief>();

  async save(brief: Brief): Promise<Brief> {
    this.briefs.set(brief.id, brief);
    return brief;
  }

  async get(briefId: string): Promise<Brief | undefined> {
    return this.briefs.get(briefId);
  }

  async listForUser(userId: string, limit = 20): Promise<Brief[]> {
    return [...this.briefs.values()]
      .filter((brief) => brief.userId === userId)
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
      .slice(0, limit);
  }

  async getLatestForUser(userId: string): Promise<Brief | undefined> {
    const list = await this.listForUser(userId, 1);
    return list[0];
  }

  clear(): void {
    this.briefs.clear();
  }
}
