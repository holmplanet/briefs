import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Pool } from "pg";

import { createPostgresPool } from "../db/postgres.js";
import type { BriefEnv } from "../config.js";
import { InMemoryOAuthTokenStore } from "./memory-token-store.js";
import { PostgresOAuthTokenStore } from "./postgres-token-store.js";
import type { OAuthTokenStore } from "./types.js";

const schemaPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../db/migrations/002_oauth_tokens.sql",
);

export async function initOAuthSchema(pool: Pool): Promise<void> {
  const sql = await readFile(schemaPath, "utf8");
  await pool.query(sql);
}

export async function createOAuthTokenStore(config: BriefEnv): Promise<OAuthTokenStore> {
  if (!config.databaseUrl) {
    return new InMemoryOAuthTokenStore();
  }

  const pool = createPostgresPool({ connectionString: config.databaseUrl });
  await initOAuthSchema(pool);
  return new PostgresOAuthTokenStore(pool);
}
