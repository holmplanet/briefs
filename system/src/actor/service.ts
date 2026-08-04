import { randomUUID } from "node:crypto";

import { ActorType, type Actor, type ActorStore } from "@briefs/shared/actor";
import type { ItemPerformer } from "@briefs/shared/item";

export class ActorService {
  constructor(private readonly store: ActorStore) {}

  get(actorId: string): Promise<Actor | undefined> {
    return this.store.get(actorId);
  }

  async ensurePerson(userId: string, name?: string): Promise<Actor> {
    return this.ensureActor({
      type: ActorType.PERSON,
      identity: userId,
      name: name?.trim() || userId,
    });
  }

  async ensureService(identity: string, name?: string): Promise<Actor> {
    return this.ensureActor({
      type: ActorType.SERVICE,
      identity,
      name: name?.trim() || identity,
    });
  }

  async ensureApplication(identity: string, name?: string): Promise<Actor> {
    return this.ensureActor({
      type: ActorType.APPLICATION,
      identity,
      name: name?.trim() || identity,
    });
  }

  async resolvePerformer(userId: string, performer?: ItemPerformer): Promise<Actor> {
    if (!performer || performer.kind === ActorType.PERSON) {
      return this.ensurePerson(userId, performer?.name);
    }

    const identity = performer.identity!;
    if (performer.kind === ActorType.APPLICATION) {
      return this.ensureApplication(identity, performer.name);
    }

    return this.ensureService(identity, performer.name);
  }

  private async ensureActor(options: {
    type: Actor["type"];
    identity: string;
    name: string;
  }): Promise<Actor> {
    const existing = await this.store.getByIdentity(options.identity);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const actor: Actor = {
      schemaVersion: 1,
      id: randomUUID(),
      type: options.type,
      name: options.name,
      identity: options.identity,
      createdAt: now,
    };

    await this.store.save(actor);
    return actor;
  }
}
