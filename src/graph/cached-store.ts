import type { RedisClientType } from "redis";

import type { GraphSnapshot } from "./models.js";
import type { GraphStore } from "./store.interface.js";

function snapshotCacheKey(userId: string): string {
  return `brief:graph:snapshot:${userId}`;
}

export class RedisCachedGraphStore implements GraphStore {
  constructor(
    private readonly inner: GraphStore,
    private readonly redis: RedisClientType,
    private readonly ttlSeconds: number,
  ) {}

  async getSnapshot(userId: string): Promise<GraphSnapshot> {
    const cached = await this.redis.get(snapshotCacheKey(userId));
    if (cached) {
      return JSON.parse(cached) as GraphSnapshot;
    }

    const snapshot = await this.inner.getSnapshot(userId);
    await this.redis.set(snapshotCacheKey(userId), JSON.stringify(snapshot), {
      EX: this.ttlSeconds,
    });
    return snapshot;
  }

  async upsertNode(node: Parameters<GraphStore["upsertNode"]>[0]) {
    const result = await this.inner.upsertNode(node);
    await this.redis.del(snapshotCacheKey(node.userId));
    return result;
  }

  async upsertEdge(edge: Parameters<GraphStore["upsertEdge"]>[0]) {
    const result = await this.inner.upsertEdge(edge);
    await this.redis.del(snapshotCacheKey(edge.userId));
    return result;
  }

  async close(): Promise<void> {
    await this.inner.close();
    if (this.redis.isOpen) {
      await this.redis.quit();
    }
  }
}
