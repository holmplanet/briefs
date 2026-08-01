import type { ActionEngine } from "./engine.js";
import type { ActionStore } from "./types.js";

let activeStore: ActionStore | null = null;
let activeEngine: ActionEngine | null = null;

export function setActionStore(store: ActionStore): void {
  activeStore = store;
}

export function getActionStore(): ActionStore {
  if (!activeStore) {
    throw new Error("Action store is not initialized. Call bootstrap() at startup.");
  }
  return activeStore;
}

export function setActionEngine(engine: ActionEngine): void {
  activeEngine = engine;
}

export function getActionEngine(): ActionEngine {
  if (!activeEngine) {
    throw new Error("Action engine is not initialized. Call bootstrap() at startup.");
  }
  return activeEngine;
}

export function resetActionRuntime(): void {
  activeStore = null;
  activeEngine = null;
}
