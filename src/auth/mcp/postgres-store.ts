import type { Pool } from "pg";

import type { ApiTokenRecord, McpApiTokenStore } from "./types.js";

type TokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  label: string | null;
  created_at: Date;
  last_used_at: Date | null;
  revoked_at: Date | null;
  expires_at: Date | null;
};

function mapRow(row: TokenRow): ApiTokenRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    label: row.label ?? undefined,
    createdAt: row.created_at.toISOString(),
    lastUsedAt: row.last_used_at?.toISOString(),
    revokedAt: row.revoked_at?.toISOString(),
    expiresAt: row.expires_at?.toISOString(),
  };
}

export class PostgresMcpApiTokenStore implements McpApiTokenStore {
  constructor(private readonly pool: Pool) {}

  async save(record: ApiTokenRecord): Promise<ApiTokenRecord> {
    await this.pool.query(
      `INSERT INTO mcp_api_tokens (
         id, user_id, token_hash, label, created_at, last_used_at, revoked_at, expires_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         last_used_at = EXCLUDED.last_used_at,
         revoked_at = EXCLUDED.revoked_at`,
      [
        record.id,
        record.userId,
        record.tokenHash,
        record.label ?? null,
        record.createdAt,
        record.lastUsedAt ?? null,
        record.revokedAt ?? null,
        record.expiresAt ?? null,
      ],
    );
    return record;
  }

  async findByHash(tokenHash: string): Promise<ApiTokenRecord | undefined> {
    const result = await this.pool.query<TokenRow>(
      `SELECT id, user_id, token_hash, label, created_at, last_used_at, revoked_at, expires_at
       FROM mcp_api_tokens
       WHERE token_hash = $1`,
      [tokenHash],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : undefined;
  }

  async listForUser(userId: string): Promise<ApiTokenRecord[]> {
    const result = await this.pool.query<TokenRow>(
      `SELECT id, user_id, token_hash, label, created_at, last_used_at, revoked_at, expires_at
       FROM mcp_api_tokens
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows.map(mapRow);
  }

  async touch(tokenId: string, usedAt: string): Promise<void> {
    await this.pool.query(`UPDATE mcp_api_tokens SET last_used_at = $2 WHERE id = $1`, [
      tokenId,
      usedAt,
    ]);
  }

  async revoke(tokenId: string, revokedAt: string): Promise<void> {
    await this.pool.query(`UPDATE mcp_api_tokens SET revoked_at = $2 WHERE id = $1`, [
      tokenId,
      revokedAt,
    ]);
  }

  clear(): void {
    throw new Error("PostgresMcpApiTokenStore does not support clear()");
  }
}
