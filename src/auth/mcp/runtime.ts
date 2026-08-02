import type { McpApiTokenStore } from "./types.js";

let activeStore: McpApiTokenStore | null = null;

export function setMcpApiTokenStore(store: McpApiTokenStore): void {
  activeStore = store;
}

export function getMcpApiTokenStore(): McpApiTokenStore {
  if (!activeStore) {
    throw new Error("MCP API token store is not initialized. Call bootstrap() at startup.");
  }
  return activeStore;
}

export function resetMcpApiTokenStore(): void {
  activeStore = null;
}
