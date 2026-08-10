import { randomUUID } from "node:crypto";

import type { Pool } from "pg";

export type OtpChallenge = {
  id: string;
  email: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  consumedAt?: Date;
  createdAt: Date;
};

export type AuthorizationCode = {
  codeHash: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  userId: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
};

export type AuthStore = {
  createOtpChallenge(input: Omit<OtpChallenge, "id" | "attempts" | "createdAt">): Promise<OtpChallenge>;
  hasRecentOtp(email: string, since: Date): Promise<boolean>;
  getOtpChallenge(id: string): Promise<OtpChallenge | undefined>;
  incrementOtpAttempt(id: string): Promise<number>;
  consumeOtpChallenge(id: string): Promise<void>;
  createAuthorizationCode(input: Omit<AuthorizationCode, "createdAt">): Promise<void>;
  consumeAuthorizationCode(codeHash: string): Promise<AuthorizationCode | undefined>;
};

export class MemoryAuthStore implements AuthStore {
  private readonly otp = new Map<string, OtpChallenge>();
  private readonly codes = new Map<string, AuthorizationCode>();

  async createOtpChallenge(input: Omit<OtpChallenge, "id" | "attempts" | "createdAt">): Promise<OtpChallenge> {
    const challenge = { ...input, id: randomUUID(), attempts: 0, createdAt: new Date() };
    this.otp.set(challenge.id, challenge);
    return challenge;
  }

  async getOtpChallenge(id: string): Promise<OtpChallenge | undefined> {
    return this.otp.get(id);
  }

  async hasRecentOtp(email: string, since: Date): Promise<boolean> {
    return [...this.otp.values()].some((challenge) => challenge.email === email && challenge.createdAt > since);
  }

  async incrementOtpAttempt(id: string): Promise<number> {
    const challenge = this.otp.get(id);
    if (!challenge) return 0;
    challenge.attempts += 1;
    return challenge.attempts;
  }

  async consumeOtpChallenge(id: string): Promise<void> {
    const challenge = this.otp.get(id);
    if (challenge) challenge.consumedAt = new Date();
  }

  async createAuthorizationCode(input: Omit<AuthorizationCode, "createdAt">): Promise<void> {
    this.codes.set(input.codeHash, { ...input, createdAt: new Date() });
  }

  async consumeAuthorizationCode(codeHash: string): Promise<AuthorizationCode | undefined> {
    const code = this.codes.get(codeHash);
    this.codes.delete(codeHash);
    return code;
  }
}

type OtpRow = {
  id: string;
  email: string;
  code_hash: string;
  attempts: number;
  expires_at: Date;
  consumed_at: Date | null;
  created_at: Date;
};

type CodeRow = {
  code_hash: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  user_id: string;
  email: string;
  expires_at: Date;
  created_at: Date;
};

function mapOtp(row: OtpRow): OtpChallenge {
  return { id: row.id, email: row.email, codeHash: row.code_hash, attempts: row.attempts, expiresAt: row.expires_at, consumedAt: row.consumed_at ?? undefined, createdAt: row.created_at };
}

function mapCode(row: CodeRow): AuthorizationCode {
  return { codeHash: row.code_hash, clientId: row.client_id, redirectUri: row.redirect_uri, codeChallenge: row.code_challenge, userId: row.user_id, email: row.email, expiresAt: row.expires_at, createdAt: row.created_at };
}

export class PostgresAuthStore implements AuthStore {
  constructor(private readonly pool: Pool) {}

  async createOtpChallenge(input: Omit<OtpChallenge, "id" | "attempts" | "createdAt">): Promise<OtpChallenge> {
    const result = await this.pool.query<OtpRow>(
      `INSERT INTO oauth_otp_challenges (id, email, code_hash, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, email, code_hash, attempts, expires_at, consumed_at, created_at`,
      [randomUUID(), input.email, input.codeHash, input.expiresAt],
    );
    return mapOtp(result.rows[0]);
  }

  async getOtpChallenge(id: string): Promise<OtpChallenge | undefined> {
    const result = await this.pool.query<OtpRow>(`SELECT id, email, code_hash, attempts, expires_at, consumed_at, created_at FROM oauth_otp_challenges WHERE id = $1`, [id]);
    return result.rows[0] ? mapOtp(result.rows[0]) : undefined;
  }

  async hasRecentOtp(email: string, since: Date): Promise<boolean> {
    const result = await this.pool.query(`SELECT 1 FROM oauth_otp_challenges WHERE email = $1 AND created_at > $2 LIMIT 1`, [email, since]);
    return result.rowCount !== 0;
  }

  async incrementOtpAttempt(id: string): Promise<number> {
    const result = await this.pool.query<{ attempts: number }>(`UPDATE oauth_otp_challenges SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts`, [id]);
    return result.rows[0]?.attempts ?? 0;
  }

  async consumeOtpChallenge(id: string): Promise<void> {
    await this.pool.query(`UPDATE oauth_otp_challenges SET consumed_at = NOW() WHERE id = $1 AND consumed_at IS NULL`, [id]);
  }

  async createAuthorizationCode(input: Omit<AuthorizationCode, "createdAt">): Promise<void> {
    await this.pool.query(
      `INSERT INTO oauth_authorization_codes (code_hash, client_id, redirect_uri, code_challenge, user_id, email, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [input.codeHash, input.clientId, input.redirectUri, input.codeChallenge, input.userId, input.email, input.expiresAt],
    );
  }

  async consumeAuthorizationCode(codeHash: string): Promise<AuthorizationCode | undefined> {
    const result = await this.pool.query<CodeRow>(
      `DELETE FROM oauth_authorization_codes WHERE code_hash = $1 RETURNING code_hash, client_id, redirect_uri, code_challenge, user_id, email, expires_at, created_at`,
      [codeHash],
    );
    return result.rows[0] ? mapCode(result.rows[0]) : undefined;
  }
}
