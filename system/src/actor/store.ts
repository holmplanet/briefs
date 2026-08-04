import type { Pool } from "pg";

import type { Actor, ActorStore } from "@briefs/shared/actor";

type ActorRow = {
  id: string;
  type: Actor["type"];
  name: string;
  identity: string;
  created_at: Date;
};

function mapRow(row: ActorRow): Actor {
  return {
    schemaVersion: 1,
    id: row.id,
    type: row.type,
    name: row.name,
    identity: row.identity,
    createdAt: row.created_at.toISOString(),
  };
}

export class PostgresActorStore implements ActorStore {
  constructor(private readonly pool: Pool) {}

  async save(actor: Actor): Promise<Actor> {
    await this.pool.query(
      `INSERT INTO actors (id, type, name, identity, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [actor.id, actor.type, actor.name, actor.identity, actor.createdAt],
    );
    return actor;
  }

  async get(actorId: string): Promise<Actor | undefined> {
    const result = await this.pool.query<ActorRow>(
      `SELECT id, type, name, identity, created_at FROM actors WHERE id = $1`,
      [actorId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  async getByIdentity(identity: string): Promise<Actor | undefined> {
    const result = await this.pool.query<ActorRow>(
      `SELECT id, type, name, identity, created_at FROM actors WHERE identity = $1`,
      [identity],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  clear(): void {
    throw new Error("PostgresActorStore.clear() is not supported");
  }
}

export class MemoryActorStore implements ActorStore {
  private readonly byId = new Map<string, Actor>();
  private readonly byIdentity = new Map<string, Actor>();

  async save(actor: Actor): Promise<Actor> {
    this.byId.set(actor.id, actor);
    this.byIdentity.set(actor.identity, actor);
    return actor;
  }

  async get(actorId: string): Promise<Actor | undefined> {
    return this.byId.get(actorId);
  }

  async getByIdentity(identity: string): Promise<Actor | undefined> {
    return this.byIdentity.get(identity);
  }

  clear(): void {
    this.byId.clear();
    this.byIdentity.clear();
  }
}
