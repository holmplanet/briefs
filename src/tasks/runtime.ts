import type { BriefTaskStore } from "./types.js";

let activeStore: BriefTaskStore | null = null;

export function setBriefTaskStore(store: BriefTaskStore): void {
  activeStore = store;
}

export function getBriefTaskStore(): BriefTaskStore {
  if (!activeStore) {
    throw new Error("Brief task store is not initialized. Call bootstrap() at startup.");
  }
  return activeStore;
}

export function resetBriefTaskRuntime(): void {
  activeStore = null;
}
