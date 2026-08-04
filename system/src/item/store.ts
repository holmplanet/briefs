import type { Pool } from "pg";

import type {
  Item,
  ItemArchiveStatus,
  ItemPriority,
  ItemSource,
  ItemStatus,
  ItemStore,
} from "@briefs/shared/item";

type ItemRow = {
  id: string;
  user_id: string;
  label: string;
  status: ItemStatus;
  due_at: Date | null;
  scheduled_at: Date | null;
  completed_at: Date | null;
  priority: ItemPriority | null;
  description: string | null;
  item_type: string;
  attributed_to_actor_id: string;
  context: string;
  origin_context: string;
  tags: string[] | null;
  refs: Item["refs"] | null;
  archive_status: ItemArchiveStatus;
  source: ItemSource | null;
  ingested_at: Date | null;
  state: Record<string, unknown> | null;
  published_at: Date;
  created_at: Date;
  updated_at: Date;
};

const ITEM_COLUMNS = `id, user_id, label, status, due_at, scheduled_at, completed_at,
  priority, description, item_type, attributed_to_actor_id, context,
  origin_context, tags, refs, archive_status, source, ingested_at, state,
  published_at, created_at, updated_at`;

function mapRow(row: ItemRow): Item {
  return {
    schemaVersion: 3,
    id: row.id,
    userId: row.user_id,
    label: row.label,
    status: row.status,
    dueAt: row.due_at?.toISOString(),
    scheduledAt: row.scheduled_at?.toISOString(),
    completedAt: row.completed_at?.toISOString(),
    priority: row.priority ?? undefined,
    description: row.description ?? undefined,
    itemType: row.item_type,
    attributedToActorId: row.attributed_to_actor_id,
    context: row.context,
    originContext: row.origin_context,
    tags: row.tags ?? undefined,
    refs: row.refs ?? undefined,
    archiveStatus: row.archive_status,
    source: row.source ?? undefined,
    ingestedAt: row.ingested_at?.toISOString(),
    state: row.state ?? undefined,
    publishedAt: row.published_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class PostgresItemStore implements ItemStore {
  constructor(private readonly pool: Pool) {}

  async save(item: Item): Promise<Item> {
    await this.pool.query(
      `INSERT INTO items (
         id, user_id, label, status, due_at, scheduled_at, completed_at,
         priority, description, item_type, attributed_to_actor_id, context,
         origin_context, tags, refs, archive_status, source, ingested_at, state,
         published_at, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
      [
        item.id,
        item.userId,
        item.label,
        item.status,
        item.dueAt ?? null,
        item.scheduledAt ?? null,
        item.completedAt ?? null,
        item.priority ?? null,
        item.description ?? null,
        item.itemType,
        item.attributedToActorId,
        item.context,
        item.originContext,
        item.tags ? JSON.stringify(item.tags) : null,
        item.refs ? JSON.stringify(item.refs) : null,
        item.archiveStatus,
        item.source ? JSON.stringify(item.source) : null,
        item.ingestedAt ?? null,
        item.state ? JSON.stringify(item.state) : null,
        item.publishedAt,
        item.createdAt,
        item.updatedAt,
      ],
    );
    return item;
  }

  async get(itemId: string): Promise<Item | undefined> {
    const result = await this.pool.query<ItemRow>(
      `SELECT ${ITEM_COLUMNS} FROM items WHERE id = $1`,
      [itemId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  async getBySource(userId: string, source: ItemSource): Promise<Item | undefined> {
    const result = await this.pool.query<ItemRow>(
      `SELECT ${ITEM_COLUMNS}
       FROM items
       WHERE user_id = $1
         AND source->>'system' = $2
         AND source->>'externalId' = $3`,
      [userId, source.system, source.externalId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  async listForUser(userId: string, status?: ItemStatus): Promise<Item[]> {
    const result = status
      ? await this.pool.query<ItemRow>(
          `SELECT ${ITEM_COLUMNS}
           FROM items
           WHERE user_id = $1 AND status = $2
           ORDER BY updated_at DESC`,
          [userId, status],
        )
      : await this.pool.query<ItemRow>(
          `SELECT ${ITEM_COLUMNS}
           FROM items
           WHERE user_id = $1
           ORDER BY updated_at DESC`,
          [userId],
        );

    return result.rows.map(mapRow);
  }

  async update(item: Item): Promise<Item> {
    await this.pool.query(
      `UPDATE items
       SET label = $2,
           status = $3,
           due_at = $4,
           scheduled_at = $5,
           completed_at = $6,
           priority = $7,
           description = $8,
           item_type = $9,
           attributed_to_actor_id = $10,
           context = $11,
           origin_context = $12,
           tags = $13,
           refs = $14,
           archive_status = $15,
           source = $16,
           ingested_at = $17,
           state = $18,
           published_at = $19,
           updated_at = $20
       WHERE id = $1`,
      [
        item.id,
        item.label,
        item.status,
        item.dueAt ?? null,
        item.scheduledAt ?? null,
        item.completedAt ?? null,
        item.priority ?? null,
        item.description ?? null,
        item.itemType,
        item.attributedToActorId,
        item.context,
        item.originContext,
        item.tags ? JSON.stringify(item.tags) : null,
        item.refs ? JSON.stringify(item.refs) : null,
        item.archiveStatus,
        item.source ? JSON.stringify(item.source) : null,
        item.ingestedAt ?? null,
        item.state ? JSON.stringify(item.state) : null,
        item.publishedAt,
        item.updatedAt,
      ],
    );
    return item;
  }

  async delete(itemId: string): Promise<boolean> {
    const result = await this.pool.query(`DELETE FROM items WHERE id = $1`, [itemId]);
    return (result.rowCount ?? 0) > 0;
  }

  clear(): void {
    throw new Error("PostgresItemStore.clear() is not supported");
  }
}

export class MemoryItemStore implements ItemStore {
  private readonly items = new Map<string, Item>();

  async save(item: Item): Promise<Item> {
    this.items.set(item.id, item);
    return item;
  }

  async get(itemId: string): Promise<Item | undefined> {
    return this.items.get(itemId);
  }

  async getBySource(userId: string, source: ItemSource): Promise<Item | undefined> {
    return [...this.items.values()].find(
      (item) =>
        item.userId === userId &&
        item.source?.system === source.system &&
        item.source?.externalId === source.externalId,
    );
  }

  async listForUser(userId: string, status?: ItemStatus): Promise<Item[]> {
    return [...this.items.values()]
      .filter((item) => item.userId === userId && (!status || item.status === status))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async update(item: Item): Promise<Item> {
    this.items.set(item.id, item);
    return item;
  }

  async delete(itemId: string): Promise<boolean> {
    return this.items.delete(itemId);
  }

  clear(): void {
    this.items.clear();
  }
}
