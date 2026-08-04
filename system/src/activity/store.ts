import type { Pool } from "pg";

import type { Activity, ActivityStore } from "@briefs/shared/activity";

type ActivityRow = {
  id: string;
  type: string;
  actor_id: string;
  object_id: string;
  origin: string | null;
  target: string | null;
  summary: string | null;
  occurred_at: Date;
  recorded_at: Date;
  result: Record<string, unknown> | null;
  client_key: string | null;
};

function mapRow(row: ActivityRow): Activity {
  return {
    schemaVersion: 1,
    id: row.id,
    type: row.type,
    actorId: row.actor_id,
    objectId: row.object_id,
    origin: row.origin ?? undefined,
    target: row.target ?? undefined,
    summary: row.summary ?? undefined,
    occurredAt: row.occurred_at.toISOString(),
    recordedAt: row.recorded_at.toISOString(),
    result: row.result ?? undefined,
    clientKey: row.client_key ?? undefined,
  };
}

export class PostgresActivityStore implements ActivityStore {
  constructor(private readonly pool: Pool) {}

  async append(activity: Activity): Promise<Activity> {
    await this.pool.query(
      `INSERT INTO activities (
         id, type, actor_id, object_id, origin, target, summary,
         occurred_at, recorded_at, result, client_key
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        activity.id,
        activity.type,
        activity.actorId,
        activity.objectId,
        activity.origin ?? null,
        activity.target ?? null,
        activity.summary ?? null,
        activity.occurredAt,
        activity.recordedAt,
        activity.result ? JSON.stringify(activity.result) : null,
        activity.clientKey ?? null,
      ],
    );
    return activity;
  }

  async get(activityId: string): Promise<Activity | undefined> {
    const result = await this.pool.query<ActivityRow>(
      `SELECT id, type, actor_id, object_id, origin, target, summary,
              occurred_at, recorded_at, result, client_key
       FROM activities
       WHERE id = $1`,
      [activityId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  async getByClientKey(actorId: string, clientKey: string): Promise<Activity | undefined> {
    const result = await this.pool.query<ActivityRow>(
      `SELECT id, type, actor_id, object_id, origin, target, summary,
              occurred_at, recorded_at, result, client_key
       FROM activities
       WHERE actor_id = $1 AND client_key = $2`,
      [actorId, clientKey],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  async listForObject(objectId: string): Promise<Activity[]> {
    const result = await this.pool.query<ActivityRow>(
      `SELECT id, type, actor_id, object_id, origin, target, summary,
              occurred_at, recorded_at, result, client_key
       FROM activities
       WHERE object_id = $1
       ORDER BY occurred_at ASC, recorded_at ASC`,
      [objectId],
    );
    return result.rows.map(mapRow);
  }

  clear(): void {
    throw new Error("PostgresActivityStore.clear() is not supported");
  }
}

export class MemoryActivityStore implements ActivityStore {
  private readonly activities = new Map<string, Activity>();

  async append(activity: Activity): Promise<Activity> {
    this.activities.set(activity.id, activity);
    return activity;
  }

  async get(activityId: string): Promise<Activity | undefined> {
    return this.activities.get(activityId);
  }

  async getByClientKey(actorId: string, clientKey: string): Promise<Activity | undefined> {
    return [...this.activities.values()].find(
      (activity) => activity.actorId === actorId && activity.clientKey === clientKey,
    );
  }

  async listForObject(objectId: string): Promise<Activity[]> {
    return [...this.activities.values()]
      .filter((activity) => activity.objectId === objectId)
      .sort((a, b) => {
        const byOccurred = a.occurredAt.localeCompare(b.occurredAt);
        return byOccurred !== 0 ? byOccurred : a.recordedAt.localeCompare(b.recordedAt);
      });
  }

  clear(): void {
    this.activities.clear();
  }
}
