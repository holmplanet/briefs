import type { Pool } from "pg";

import type { TaskPriority, TaskStatus } from "../graph/tasks/protocol.js";
import type { BriefTask, BriefTaskStore } from "./types.js";

type TaskRow = {
  id: string;
  user_id: string;
  label: string;
  status: TaskStatus;
  due_at: Date | null;
  scheduled_at: Date | null;
  completed_at: Date | null;
  priority: TaskPriority | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
};

function mapTask(row: TaskRow): BriefTask {
  return {
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

export class PostgresBriefTaskStore implements BriefTaskStore {
  constructor(private readonly pool: Pool) {}

  async save(task: BriefTask): Promise<BriefTask> {
    await this.pool.query(
      `INSERT INTO brief_tasks (
         id, user_id, label, status, due_at, scheduled_at, completed_at,
         priority, description, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        task.id,
        task.userId,
        task.label,
        task.status,
        task.dueAt ?? null,
        task.scheduledAt ?? null,
        task.completedAt ?? null,
        task.priority ?? null,
        task.description ?? null,
        task.createdAt,
        task.updatedAt,
      ],
    );
    return task;
  }

  async get(taskId: string): Promise<BriefTask | undefined> {
    const result = await this.pool.query<TaskRow>(
      `SELECT id, user_id, label, status, due_at, scheduled_at, completed_at,
              priority, description, created_at, updated_at
       FROM brief_tasks
       WHERE id = $1`,
      [taskId],
    );
    const row = result.rows[0];
    return row ? mapTask(row) : undefined;
  }

  async listForUser(userId: string, status?: TaskStatus): Promise<BriefTask[]> {
    const result = status
      ? await this.pool.query<TaskRow>(
          `SELECT id, user_id, label, status, due_at, scheduled_at, completed_at,
                  priority, description, created_at, updated_at
           FROM brief_tasks
           WHERE user_id = $1 AND status = $2
           ORDER BY updated_at DESC`,
          [userId, status],
        )
      : await this.pool.query<TaskRow>(
          `SELECT id, user_id, label, status, due_at, scheduled_at, completed_at,
                  priority, description, created_at, updated_at
           FROM brief_tasks
           WHERE user_id = $1
           ORDER BY updated_at DESC`,
          [userId],
        );

    return result.rows.map(mapTask);
  }

  async update(task: BriefTask): Promise<BriefTask> {
    await this.pool.query(
      `UPDATE brief_tasks
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
        task.id,
        task.label,
        task.status,
        task.dueAt ?? null,
        task.scheduledAt ?? null,
        task.completedAt ?? null,
        task.priority ?? null,
        task.description ?? null,
        task.updatedAt,
      ],
    );
    return task;
  }

  async delete(taskId: string): Promise<boolean> {
    const result = await this.pool.query(`DELETE FROM brief_tasks WHERE id = $1`, [taskId]);
    return (result.rowCount ?? 0) > 0;
  }

  clear(): void {
    throw new Error("PostgresBriefTaskStore.clear() is not supported");
  }
}
