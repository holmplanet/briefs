import { randomUUID } from "node:crypto";

import { ActorType, type Actor, type ActorStore } from "@briefs/shared/actor";

export class ActorService {
  constructor(private readonly store: ActorStore) {}

  get(actorId: string): Promise<Actor | undefined> {
    return this.store.get(actorId);
  }

  async ensurePerson(userId: string, name?: string): Promise<Actor> {
    const existing = await this.store.getByIdentity(userId);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const actor: Actor = {
      schemaVersion: 1,
      id: randomUUID(),
      type: ActorType.PERSON,
      name: name?.trim() || userId,
      identity: userId,
      createdAt: now,
    };

    await this.store.save(actor);
    return actor;
  }
}
