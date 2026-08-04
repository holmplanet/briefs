import { ActorService, MemoryActorStore, PostgresActorStore } from "./actor/index.js";
import { ActivityService, MemoryActivityStore, PostgresActivityStore } from "./activity/index.js";
import type { BriefsConfig } from "./config.js";
import { loadConfig } from "./config.js";
import { createPool, runMigrations } from "./db.js";
import { ItemService, MemoryItemStore, PostgresItemStore } from "./item/index.js";

export type AppContext = {
  config: BriefsConfig;
  items: ItemService;
  actors: ActorService;
  activities: ActivityService;
};

export async function bootstrap(): Promise<AppContext> {
  const config = loadConfig();

  if (config.databaseUrl) {
    const pool = createPool(config.databaseUrl);
    await runMigrations(pool);
    const actors = new ActorService(new PostgresActorStore(pool));
    const activities = new ActivityService(new PostgresActivityStore(pool));
    const itemStore = new PostgresItemStore(pool);
    const items = new ItemService(itemStore, actors, activities);
    return { config, actors, activities, items };
  }

  const actors = new ActorService(new MemoryActorStore());
  const activities = new ActivityService(new MemoryActivityStore());
  const itemStore = new MemoryItemStore();
  const items = new ItemService(itemStore, actors, activities);
  return { config, actors, activities, items };
}
