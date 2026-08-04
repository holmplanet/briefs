import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { Pool, type PoolConfig } from "pg";

const migrationsDir = join(process.cwd(), "db/migrations");

let migrationPromise: Promise<void> | null = null;

export function createPool(connectionString: string, poolConfig?: Omit<PoolConfig, "connectionString">): Pool {
  return new Pool({ connectionString, ...poolConfig });
}

export async function runMigrations(pool: Pool): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const files = (await readdir(migrationsDir))
        .filter((file) => file.endsWith(".sql"))
        .sort();

      for (const file of files) {
        const sql = await readFile(join(migrationsDir, file), "utf8");
        await pool.query(sql);
      }
    })();
  }

  await migrationPromise;
}

export async function closePool(pool: Pool): Promise<void> {
  await pool.end();
}
