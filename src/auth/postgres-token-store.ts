import type { Pool } from "pg";

import type { OAuthTokens, OAuthTokenStore } from "./types.js";

type TokenRow = {
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: Date | null;
  scopes: string[];
};

export class PostgresOAuthTokenStore implements OAuthTokenStore {
  constructor(private readonly pool: Pool) {}

  async get(userId: string, provider: string): Promise<OAuthTokens | undefined> {
    const result = await this.pool.query<TokenRow>(
      `SELECT user_id, provider, access_token, refresh_token, expires_at, scopes
       FROM oauth_tokens
       WHERE user_id = $1 AND provider = $2`,
      [userId, provider],
    );

    const row = result.rows[0];
    if (!row) {
      return undefined;
    }

    return {
      userId: row.user_id,
      provider: row.provider,
      accessToken: row.access_token,
      refreshToken: row.refresh_token ?? undefined,
      expiresAt: row.expires_at?.toISOString(),
      scopes: row.scopes ?? [],
    };
  }

  async save(tokens: OAuthTokens): Promise<void> {
    await this.pool.query(
      `INSERT INTO oauth_tokens (
         user_id, provider, access_token, refresh_token, expires_at, scopes, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, provider) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, oauth_tokens.refresh_token),
         expires_at = EXCLUDED.expires_at,
         scopes = EXCLUDED.scopes,
         updated_at = NOW()`,
      [
        tokens.userId,
        tokens.provider,
        tokens.accessToken,
        tokens.refreshToken ?? null,
        tokens.expiresAt ?? null,
        tokens.scopes,
      ],
    );
  }

  async delete(userId: string, provider: string): Promise<void> {
    await this.pool.query("DELETE FROM oauth_tokens WHERE user_id = $1 AND provider = $2", [
      userId,
      provider,
    ]);
  }
}
