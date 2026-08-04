import type { Actor } from "./schema.js";

export interface ActorStore {
  save(actor: Actor): Promise<Actor>;
  get(actorId: string): Promise<Actor | undefined>;
  getByIdentity(identity: string): Promise<Actor | undefined>;
  clear(): void;
}
