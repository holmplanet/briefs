import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Pool, type PoolConfig } from "pg";

export type PostgresPoolOptions = {
  connectionString: string;
  poolConfig?: Omit<PoolConfig, "connectionString">;
};

const schemaPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../db/migrations/001_graph.sql",
);

const dropOAuthSchemaPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../db/migrations/006_drop_oauth_tokens.sql",
);

export function createPostgresPool(options: PostgresPoolOptions): Pool {
  return new Pool({
    connectionString: options.connectionString,
    ...options.poolConfig,
  });
}

export async function initGraphSchema(pool: Pool): Promise<void> {
  const sql = await readFile(schemaPath, "utf8");
  await pool.query(sql);

  const dropOAuthSql = await readFile(dropOAuthSchemaPath, "utf8");
  await pool.query(dropOAuthSql);
}

export async function closePostgresPool(pool: Pool): Promise<void> {
  await pool.end();
}
