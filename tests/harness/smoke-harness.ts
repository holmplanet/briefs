import type { Server } from "node:http";

import { InMemoryOAuthTokenStore } from "../../src/auth/memory-token-store.js";
import { resetOAuthTokenStore, setOAuthTokenStore } from "../../src/auth/runtime.js";
import { ConnectorRunner, createConnectorRegistry } from "../../src/connectors/index.js";
import { connectorStatusStore } from "../../src/connectors/status.js";
import { resetConnectorRegistry, setConnectorRegistry } from "../../src/connectors/runtime.js";
import { briefStore } from "../../src/briefs/store.js";
import { loadConfig, type BriefEnv } from "../../src/config.js";
import { InMemoryGraphStore } from "../../src/graph/memory-store.js";
import { resetGraphStore, setGraphStore } from "../../src/graph/runtime.js";
import { createApp } from "../../src/index.js";
import {
  SmokeCalendarConnector,
  SmokeWeatherConnector,
} from "../fixtures/smoke-connectors.js";

export function installSmokeConnectors(store: InMemoryGraphStore): void {
  const registry = createConnectorRegistry(new ConnectorRunner(store));
  registry.register(new SmokeCalendarConnector());
  registry.register(new SmokeWeatherConnector(store));
  setConnectorRegistry(registry);
}

export function resetSmokeRuntime(): InMemoryGraphStore {
  resetGraphStore();
  resetConnectorRegistry();
  resetOAuthTokenStore();
  connectorStatusStore.clear();
  briefStore.clear();

  const store = new InMemoryGraphStore();
  setGraphStore(store);
  setOAuthTokenStore(new InMemoryOAuthTokenStore());
  installSmokeConnectors(store);
  return store;
}

export async function startSmokeServer(): Promise<{
  config: BriefEnv;
  port: number;
  close: () => Promise<void>;
}> {
  resetSmokeRuntime();
  const config = loadConfig();
  const app = createApp(config);
  const server: Server = app.listen(0);

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected smoke server to bind to a TCP port");
  }

  return {
    config,
    port: address.port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
