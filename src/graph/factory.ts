import type { Pool } from "pg";
import type { RedisClientType } from "redis";

import { createPostgresPool, initGraphSchema } from "../db/postgres.js";
import { connectRedisClient, createRedisClient } from "../db/redis.js";
import type { BriefEnv } from "../config.js";
import { RedisCachedGraphStore } from "./cached-store.js";
import { InMemoryGraphStore } from "./memory-store.js";
import { PostgresGraphStore } from "./postgres-store.js";
import type { GraphStore } from "./store.interface.js";

type GraphRuntime = {
  store: GraphStore;
  pool?: Pool;
  redis?: RedisClientType;
};

let runtime: GraphRuntime | null = null;

export async function createGraphStore(config: BriefEnv): Promise<GraphStore> {
  if (runtime) {
    return runtime.store;
  }

  if (!config.databaseUrl) {
    const store = new InMemoryGraphStore();
    runtime = { store };
    return store;
  }

  const pool = createPostgresPool({ connectionString: config.databaseUrl });
  await initGraphSchema(pool);
  let store: GraphStore = new PostgresGraphStore(pool);

  let redis: RedisClientType | undefined;
  if (config.redisUrl) {
    redis = createRedisClient({ url: config.redisUrl });
    await connectRedisClient(redis);
    store = new RedisCachedGraphStore(store, redis, config.graphCacheTtlSeconds);
  }

  runtime = { store, pool, redis };
  return store;
}

export async function shutdownGraphStore(): Promise<void> {
  if (!runtime) {
    return;
  }

  await runtime.store.close();
  runtime = null;
}
