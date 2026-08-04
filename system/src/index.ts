import "dotenv/config";

import { fileURLToPath } from "node:url";

import express, { type Express, type Request, type Response } from "express";

import { mountApiRoutes } from "./api/router.js";
import { loadConfig, type BriefsConfig } from "./config.js";
import { closePool, createPool, runMigrations } from "./db.js";
import { PersonalBriefService } from "./personal/brief-service.js";
import { MemoryBriefStore, PostgresBriefStore } from "./personal/brief-store.js";
import { PersonalStitchService } from "./personal/service.js";
import { MemoryStitchStore, PostgresStitchStore } from "./personal/store.js";

export type AppContext = {
  config: BriefsConfig;
  stitches: PersonalStitchService;
  briefs: PersonalBriefService;
};

export async function bootstrap(): Promise<AppContext> {
  const config = loadConfig();

  if (config.databaseUrl) {
    const pool = createPool(config.databaseUrl);
    await runMigrations(pool);
    const stitches = new PersonalStitchService(new PostgresStitchStore(pool));
    return {
      config,
      stitches,
      briefs: new PersonalBriefService(new PostgresBriefStore(pool), stitches),
    };
  }

  const stitches = new PersonalStitchService(new MemoryStitchStore());
  return {
    config,
    stitches,
    briefs: new PersonalBriefService(new MemoryBriefStore(), stitches),
  };
}

export function createApp(context: AppContext): Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "holmplanet-briefs",
      storage: context.config.databaseUrl ? "postgres" : "memory",
    });
  });

  mountApiRoutes(app, {
    stitches: context.stitches,
    briefs: context.briefs,
  });

  return app;
}

export async function startServer(): Promise<Express> {
  const context = await bootstrap();
  const app = createApp(context);

  app.listen(context.config.port, context.config.host, () => {
    console.log(`Briefs API listening on http://${context.config.host}:${context.config.port}`);
    console.log(`Health: http://localhost:${context.config.port}/health`);
    console.log(`Stitches: http://localhost:${context.config.port}/api/v1/stitches`);
    console.log(`Briefs: http://localhost:${context.config.port}/api/v1/briefs`);
    console.log(`Brief me: POST http://localhost:${context.config.port}/api/v1/brief/generate`);
    console.log(`Storage: ${context.config.databaseUrl ? "postgres" : "memory"}`);
  });

  return app;
}

export async function shutdown(context: AppContext): Promise<void> {
  if (context.config.databaseUrl) {
    const pool = createPool(context.config.databaseUrl);
    await closePool(pool);
  }
}

const entrypoint = fileURLToPath(import.meta.url);
if (process.argv[1] === entrypoint) {
  startServer().catch((error) => {
    console.error("Failed to start Briefs:", error);
    process.exit(1);
  });
}
