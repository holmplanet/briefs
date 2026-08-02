import { InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

import type { McpAuthConfig } from "../../config.js";
import { hashApiToken } from "./hashing.js";
import { getMcpApiTokenStore } from "./runtime.js";

const TEN_YEARS_SECONDS = 10 * 365 * 24 * 60 * 60;

function tokenExpiresAt(record: { expiresAt?: string }): number {
  if (record.expiresAt) {
    return Math.floor(Date.parse(record.expiresAt) / 1000);
  }
  return Math.floor(Date.now() / 1000) + TEN_YEARS_SECONDS;
}

export class BriefMcpTokenVerifier {
  constructor(private readonly config: McpAuthConfig) {}

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const store = getMcpApiTokenStore();
    const record = await store.findByHash(hashApiToken(token));
    if (!record || record.revokedAt) {
      throw new InvalidTokenError("Invalid or revoked access token");
    }

    const expiresAt = tokenExpiresAt(record);
    if (expiresAt < Date.now() / 1000) {
      throw new InvalidTokenError("Token has expired");
    }

    await store.touch(record.id, new Date().toISOString());

    return {
      token,
      clientId: "brief-api-token",
      scopes: ["mcp"],
      expiresAt,
      resource: new URL(this.config.serverUri),
      extra: {
        userId: record.userId,
      },
    };
  }
}
