export type McpAuthConfig = {
  enabled: boolean;
  adminSecret?: string;
  serverUri: string;
};

export type ApiTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  label?: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
};

export type CreateApiTokenInput = {
  userId: string;
  label?: string;
  expiresAt?: string;
};

export type CreatedApiToken = ApiTokenRecord & {
  token: string;
};

export interface McpApiTokenStore {
  save(record: ApiTokenRecord): Promise<ApiTokenRecord>;
  findByHash(tokenHash: string): Promise<ApiTokenRecord | undefined>;
  listForUser(userId: string): Promise<ApiTokenRecord[]>;
  touch(tokenId: string, usedAt: string): Promise<void>;
  revoke(tokenId: string, revokedAt: string): Promise<void>;
  clear(): void;
}
