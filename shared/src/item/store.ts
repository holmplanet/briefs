import type { ItemStatus } from "./constants.js";
import type { Item } from "./schema.js";

export interface ItemStore {
  save(item: Item): Promise<Item>;
  get(itemId: string): Promise<Item | undefined>;
  listForUser(userId: string, status?: ItemStatus): Promise<Item[]>;
  update(item: Item): Promise<Item>;
  delete(itemId: string): Promise<boolean>;
  clear(): void;
}
