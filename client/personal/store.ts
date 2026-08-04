import type { Pool } from "pg";

import type { TaskNode, TaskPriority, TaskStatus } from "./schema/task-node.js";

export interface TaskNodeStore {
  save(task: TaskNode): Promise<TaskNode>;
  get(taskId: string): Promise<TaskNode | undefined>;
  listForUser(userId: string, status?: TaskStatus): Promise<TaskNode[]>;
  update(task: TaskNode): Promise<TaskNode>;
  delete(taskId: string): Promise<boolean>;
  clear(): void;
}

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

function mapRow(row: TaskRow): TaskNode {
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

export class PostgresTaskNodeStore implements TaskNodeStore {
  constructor(private readonly pool: Pool) {}

  async save(task: TaskNode): Promise<TaskNode> {
    await this.pool.query(
      `INSERT INTO task_nodes (
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

  async get(taskId: string): Promise<TaskNode | undefined> {
    const result = await this.pool.query<TaskRow>(
      `SELECT id, user_id, label, status, due_at, scheduled_at, completed_at,
              priority, description, created_at, updated_at
       FROM task_nodes
       WHERE id = $1`,
      [taskId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  async listForUser(userId: string, status?: TaskStatus): Promise<TaskNode[]> {
    const result = status
      ? await this.pool.query<TaskRow>(
          `SELECT id, user_id, label, status, due_at, scheduled_at, completed_at,
                  priority, description, created_at, updated_at
           FROM task_nodes
           WHERE user_id = $1 AND status = $2
           ORDER BY updated_at DESC`,
          [userId, status],
        )
      : await this.pool.query<TaskRow>(
          `SELECT id, user_id, label, status, due_at, scheduled_at, completed_at,
                  priority, description, created_at, updated_at
           FROM task_nodes
           WHERE user_id = $1
           ORDER BY updated_at DESC`,
          [userId],
        );

    return result.rows.map(mapRow);
  }

  async update(task: TaskNode): Promise<TaskNode> {
    await this.pool.query(
      `UPDATE task_nodes
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
    const result = await this.pool.query(`DELETE FROM task_nodes WHERE id = $1`, [taskId]);
    return (result.rowCount ?? 0) > 0;
  }

  clear(): void {
    throw new Error("PostgresTaskNodeStore.clear() is not supported");
  }
}

export class MemoryTaskNodeStore implements TaskNodeStore {
  private readonly tasks = new Map<string, TaskNode>();

  async save(task: TaskNode): Promise<TaskNode> {
    this.tasks.set(task.id, task);
    return task;
  }

  async get(taskId: string): Promise<TaskNode | undefined> {
    return this.tasks.get(taskId);
  }

  async listForUser(userId: string, status?: TaskStatus): Promise<TaskNode[]> {
    return [...this.tasks.values()]
      .filter((task) => task.userId === userId && (!status || task.status === status))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async update(task: TaskNode): Promise<TaskNode> {
    this.tasks.set(task.id, task);
    return task;
  }

  async delete(taskId: string): Promise<boolean> {
    return this.tasks.delete(taskId);
  }

  clear(): void {
    this.tasks.clear();
  }
}
