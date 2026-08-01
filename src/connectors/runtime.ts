import type { ConnectorRegistry } from "./registry.js";

let activeRegistry: ConnectorRegistry | null = null;

export function setConnectorRegistry(registry: ConnectorRegistry): void {
  activeRegistry = registry;
}

export function getConnectorRegistry(): ConnectorRegistry {
  if (!activeRegistry) {
    throw new Error("Connector registry is not initialized. Call bootstrap() at startup.");
  }
  return activeRegistry;
}

export function resetConnectorRegistry(): void {
  activeRegistry = null;
}
