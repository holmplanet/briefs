import type { StitchStatus } from "./constants.js";
import type { Stitch } from "./schema.js";

export interface StitchStore {
  save(stitch: Stitch): Promise<Stitch>;
  get(stitchId: string): Promise<Stitch | undefined>;
  listForUser(userId: string, status?: StitchStatus): Promise<Stitch[]>;
  update(stitch: Stitch): Promise<Stitch>;
  delete(stitchId: string): Promise<boolean>;
  clear(): void;
}
