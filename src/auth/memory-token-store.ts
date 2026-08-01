import type { OAuthTokens, OAuthTokenStore } from "./types.js";

export class InMemoryOAuthTokenStore implements OAuthTokenStore {
  private readonly tokens = new Map<string, OAuthTokens>();

  private key(userId: string, provider: string): string {
    return `${userId}:${provider}`;
  }

  async get(userId: string, provider: string): Promise<OAuthTokens | undefined> {
    return this.tokens.get(this.key(userId, provider));
  }

  async save(tokens: OAuthTokens): Promise<void> {
    this.tokens.set(this.key(tokens.userId, tokens.provider), tokens);
  }

  async delete(userId: string, provider: string): Promise<void> {
    this.tokens.delete(this.key(userId, provider));
  }

  clear(): void {
    this.tokens.clear();
  }
}
