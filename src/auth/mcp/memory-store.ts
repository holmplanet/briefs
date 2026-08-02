import type { ApiTokenRecord, McpApiTokenStore } from "./types.js";

export class InMemoryMcpApiTokenStore implements McpApiTokenStore {
  private readonly byId = new Map<string, ApiTokenRecord>();
  private readonly byHash = new Map<string, string>();

  async save(record: ApiTokenRecord): Promise<ApiTokenRecord> {
    this.byId.set(record.id, record);
    this.byHash.set(record.tokenHash, record.id);
    return record;
  }

  async findByHash(tokenHash: string): Promise<ApiTokenRecord | undefined> {
    const id = this.byHash.get(tokenHash);
    return id ? this.byId.get(id) : undefined;
  }

  async listForUser(userId: string): Promise<ApiTokenRecord[]> {
    return [...this.byId.values()].filter((record) => record.userId === userId);
  }

  async touch(tokenId: string, usedAt: string): Promise<void> {
    const record = this.byId.get(tokenId);
    if (!record) return;
    this.byId.set(tokenId, { ...record, lastUsedAt: usedAt });
  }

  async revoke(tokenId: string, revokedAt: string): Promise<void> {
    const record = this.byId.get(tokenId);
    if (!record) return;
    this.byId.set(tokenId, { ...record, revokedAt });
  }

  clear(): void {
    this.byId.clear();
    this.byHash.clear();
  }
}
