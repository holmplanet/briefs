import { createClient, type RedisClientType } from "redis";

export type RedisClientOptions = {
  url: string;
};

export function createRedisClient(options: RedisClientOptions): RedisClientType {
  return createClient({ url: options.url });
}

export async function connectRedisClient(client: RedisClientType): Promise<void> {
  if (!client.isOpen) {
    await client.connect();
  }
}

export async function closeRedisClient(client: RedisClientType): Promise<void> {
  if (client.isOpen) {
    await client.quit();
  }
}
