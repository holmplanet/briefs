import type { GraphStore } from "./store.interface.js";

let activeStore: GraphStore | null = null;

export function setGraphStore(store: GraphStore): void {
  activeStore = store;
}

export function getGraphStore(): GraphStore {
  if (!activeStore) {
    throw new Error("Graph store is not initialized. Call createGraphStore() at startup.");
  }
  return activeStore;
}

export function resetGraphStore(): void {
  activeStore = null;
}
