import type { BriefsConfig } from "./config.js";
import { loadConfig } from "./config.js";
import { createPool, runMigrations } from "./db.js";
import { BriefService, MemoryBriefStore, PostgresBriefStore } from "./brief/index.js";
import { MemoryStitchStore, PostgresStitchStore, StitchService } from "./stitch/index.js";

export type AppContext = {
  config: BriefsConfig;
  stitches: StitchService;
  briefs: BriefService;
};

export async function bootstrap(): Promise<AppContext> {
  const config = loadConfig();

  if (config.databaseUrl) {
    const pool = createPool(config.databaseUrl);
    await runMigrations(pool);
    const stitches = new StitchService(new PostgresStitchStore(pool));
    return {
      config,
      stitches,
      briefs: new BriefService(new PostgresBriefStore(pool), stitches),
    };
  }

  const stitches = new StitchService(new MemoryStitchStore());
  return {
    config,
    stitches,
    briefs: new BriefService(new MemoryBriefStore(), stitches),
  };
}
