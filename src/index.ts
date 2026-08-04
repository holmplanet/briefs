import "dotenv/config";

import { fileURLToPath } from "node:url";

import express, { type Express, type Request, type Response } from "express";

import { PersonalTaskService } from "../client/personal/service.js";
import { MemoryTaskNodeStore, PostgresTaskNodeStore } from "../client/personal/store.js";
import { mountApiRoutes } from "./api/router.js";
import { loadConfig, type BriefConfig } from "./config.js";
import { closePool, createPool, runMigrations } from "./db.js";

export type AppContext = {
  config: BriefConfig;
  service: PersonalTaskService;
};

export async function bootstrap(): Promise<AppContext> {
  const config = loadConfig();

  if (config.databaseUrl) {
    const pool = createPool(config.databaseUrl);
    await runMigrations(pool);
    return {
      config,
      service: new PersonalTaskService(new PostgresTaskNodeStore(pool)),
    };
  }

  return {
    config,
    service: new PersonalTaskService(new MemoryTaskNodeStore()),
  };
}

export function createApp(context: AppContext): Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "holmplanet-brief",
      storage: context.config.databaseUrl ? "postgres" : "memory",
    });
  });

  mountApiRoutes(app, context.service);

  return app;
}

export async function startServer(): Promise<Express> {
  const context = await bootstrap();
  const app = createApp(context);

  app.listen(context.config.port, context.config.host, () => {
    console.log(`Brief API listening on http://${context.config.host}:${context.config.port}`);
    console.log(`Health: http://localhost:${context.config.port}/health`);
    console.log(`Tasks: http://localhost:${context.config.port}/api/v1/tasks`);
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
    console.error("Failed to start Brief:", error);
    process.exit(1);
  });
}
