import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Pool } from "pg";

import type { BriefEnv } from "../config.js";
import { createPostgresPool } from "../db/postgres.js";
import { InMemoryActionStore } from "./memory-store.js";
import { PostgresActionStore } from "./postgres-store.js";
import type { ActionStore } from "./types.js";

const schemaPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../db/migrations/003_actions.sql",
);

export async function initActionSchema(pool: Pool): Promise<void> {
  const sql = await readFile(schemaPath, "utf8");
  await pool.query(sql);
}

export async function createActionStore(config: BriefEnv): Promise<ActionStore> {
  if (!config.databaseUrl) {
    return new InMemoryActionStore();
  }

  const pool = createPostgresPool({ connectionString: config.databaseUrl });
  await initActionSchema(pool);
  return new PostgresActionStore(pool);
}
