import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Pool } from "pg";

import type { BriefEnv } from "../config.js";
import { createPostgresPool } from "../db/postgres.js";
import { InMemoryBriefTaskStore } from "./memory-store.js";
import { PostgresBriefTaskStore } from "./postgres-store.js";
import type { BriefTaskStore } from "./types.js";

const schemaPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../db/migrations/005_brief_tasks.sql",
);

export async function initBriefTaskSchema(pool: Pool): Promise<void> {
  const sql = await readFile(schemaPath, "utf8");
  await pool.query(sql);
}

export async function createBriefTaskStore(config: BriefEnv): Promise<BriefTaskStore> {
  if (!config.databaseUrl) {
    return new InMemoryBriefTaskStore();
  }

  const pool = createPostgresPool({ connectionString: config.databaseUrl });
  await initBriefTaskSchema(pool);
  return new PostgresBriefTaskStore(pool);
}
