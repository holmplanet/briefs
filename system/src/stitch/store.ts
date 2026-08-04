import type { Pool } from "pg";

import type { Stitch, StitchPriority, StitchStatus, StitchStore } from "@briefs/shared/stitch";

type StitchRow = {
  id: string;
  user_id: string;
  label: string;
  status: StitchStatus;
  due_at: Date | null;
  scheduled_at: Date | null;
  completed_at: Date | null;
  priority: StitchPriority | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
};

function mapRow(row: StitchRow): Stitch {
  return {
    schemaVersion: 1,
    id: row.id,
    userId: row.user_id,
    label: row.label,
    status: row.status,
    dueAt: row.due_at?.toISOString(),
    scheduledAt: row.scheduled_at?.toISOString(),
    completedAt: row.completed_at?.toISOString(),
    priority: row.priority ?? undefined,
    description: row.description ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class PostgresStitchStore implements StitchStore {
  constructor(private readonly pool: Pool) {}

  async save(stitch: Stitch): Promise<Stitch> {
    await this.pool.query(
      `INSERT INTO stitch_nodes (
         id, user_id, label, status, due_at, scheduled_at, completed_at,
         priority, description, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        stitch.id,
        stitch.userId,
        stitch.label,
        stitch.status,
        stitch.dueAt ?? null,
        stitch.scheduledAt ?? null,
        stitch.completedAt ?? null,
        stitch.priority ?? null,
        stitch.description ?? null,
        stitch.createdAt,
        stitch.updatedAt,
      ],
    );
    return stitch;
  }

  async get(stitchId: string): Promise<Stitch | undefined> {
    const result = await this.pool.query<StitchRow>(
      `SELECT id, user_id, label, status, due_at, scheduled_at, completed_at,
              priority, description, created_at, updated_at
       FROM stitch_nodes
       WHERE id = $1`,
      [stitchId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  async listForUser(userId: string, status?: StitchStatus): Promise<Stitch[]> {
    const result = status
      ? await this.pool.query<StitchRow>(
          `SELECT id, user_id, label, status, due_at, scheduled_at, completed_at,
                  priority, description, created_at, updated_at
           FROM stitch_nodes
           WHERE user_id = $1 AND status = $2
           ORDER BY updated_at DESC`,
          [userId, status],
        )
      : await this.pool.query<StitchRow>(
          `SELECT id, user_id, label, status, due_at, scheduled_at, completed_at,
                  priority, description, created_at, updated_at
           FROM stitch_nodes
           WHERE user_id = $1
           ORDER BY updated_at DESC`,
          [userId],
        );

    return result.rows.map(mapRow);
  }

  async update(stitch: Stitch): Promise<Stitch> {
    await this.pool.query(
      `UPDATE stitch_nodes
       SET label = $2,
           status = $3,
           due_at = $4,
           scheduled_at = $5,
           completed_at = $6,
           priority = $7,
           description = $8,
           updated_at = $9
       WHERE id = $1`,
      [
        stitch.id,
        stitch.label,
        stitch.status,
        stitch.dueAt ?? null,
        stitch.scheduledAt ?? null,
        stitch.completedAt ?? null,
        stitch.priority ?? null,
        stitch.description ?? null,
        stitch.updatedAt,
      ],
    );
    return stitch;
  }

  async delete(stitchId: string): Promise<boolean> {
    const result = await this.pool.query(`DELETE FROM stitch_nodes WHERE id = $1`, [stitchId]);
    return (result.rowCount ?? 0) > 0;
  }

  clear(): void {
    throw new Error("PostgresStitchStore.clear() is not supported");
  }
}

export class MemoryStitchStore implements StitchStore {
  private readonly stitches = new Map<string, Stitch>();

  async save(stitch: Stitch): Promise<Stitch> {
    this.stitches.set(stitch.id, stitch);
    return stitch;
  }

  async get(stitchId: string): Promise<Stitch | undefined> {
    return this.stitches.get(stitchId);
  }

  async listForUser(userId: string, status?: StitchStatus): Promise<Stitch[]> {
    return [...this.stitches.values()]
      .filter((stitch) => stitch.userId === userId && (!status || stitch.status === status))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async update(stitch: Stitch): Promise<Stitch> {
    this.stitches.set(stitch.id, stitch);
    return stitch;
  }

  async delete(stitchId: string): Promise<boolean> {
    return this.stitches.delete(stitchId);
  }

  clear(): void {
    this.stitches.clear();
  }
}
