import type { Activity } from "./schema.js";

export interface ActivityStore {
  append(activity: Activity): Promise<Activity>;
  get(activityId: string): Promise<Activity | undefined>;
  getByClientKey(actorId: string, clientKey: string): Promise<Activity | undefined>;
  listForObject(objectId: string): Promise<Activity[]>;
  clear(): void;
}
