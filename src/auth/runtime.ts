import type { OAuthTokenStore } from "./types.js";

let activeStore: OAuthTokenStore | null = null;

export function setOAuthTokenStore(store: OAuthTokenStore): void {
  activeStore = store;
}

export function getOAuthTokenStore(): OAuthTokenStore {
  if (!activeStore) {
    throw new Error("OAuth token store is not initialized. Call bootstrap() at startup.");
  }
  return activeStore;
}

export function resetOAuthTokenStore(): void {
  activeStore = null;
}
