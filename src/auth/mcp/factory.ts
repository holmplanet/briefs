import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Pool } from "pg";

import type { BriefEnv } from "../../config.js";
import { createPostgresPool } from "../../db/postgres.js";
import { generateApiToken, hashApiToken } from "./hashing.js";
import { InMemoryMcpApiTokenStore } from "./memory-store.js";
import { PostgresMcpApiTokenStore } from "./postgres-store.js";
import type {
  ApiTokenRecord,
  CreateApiTokenInput,
  CreatedApiToken,
  McpApiTokenStore,
} from "./types.js";

const schemaPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../db/migrations/004_api_tokens.sql",
);

export async function initMcpApiTokenSchema(pool: Pool): Promise<void> {
  const sql = await readFile(schemaPath, "utf8");
  await pool.query(sql);
}

export async function createMcpApiTokenStore(config: BriefEnv): Promise<McpApiTokenStore> {
  if (!config.databaseUrl) {
    return new InMemoryMcpApiTokenStore();
  }

  const pool = createPostgresPool({ connectionString: config.databaseUrl });
  await initMcpApiTokenSchema(pool);
  return new PostgresMcpApiTokenStore(pool);
}

export async function registerStaticMcpTokens(
  store: McpApiTokenStore,
  staticTokens?: string,
): Promise<void> {
  if (!staticTokens) {
    return;
  }

  const createdAt = new Date().toISOString();
  for (const entry of staticTokens.split(",")) {
    const [userId, token] = entry.split(":").map((part) => part.trim());
    if (!userId || !token) {
      continue;
    }

    await store.save({
      id: randomUUID(),
      userId,
      tokenHash: hashApiToken(token),
      label: "static-env",
      createdAt,
    });
  }
}

export async function createMcpApiToken(
  store: McpApiTokenStore,
  input: CreateApiTokenInput,
): Promise<CreatedApiToken> {
  const token = generateApiToken();
  const record: ApiTokenRecord = {
    id: randomUUID(),
    userId: input.userId,
    tokenHash: hashApiToken(token),
    label: input.label,
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
  };

  await store.save(record);
  return { ...record, token };
}
