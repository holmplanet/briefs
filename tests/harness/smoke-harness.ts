import type { Server } from "node:http";

import { InMemoryOAuthTokenStore } from "../../src/auth/memory-token-store.js";
import { resetOAuthTokenStore, setOAuthTokenStore } from "../../src/auth/runtime.js";
import { ConnectorRunner, createConnectorRegistry } from "../../src/connectors/index.js";
import { BriefTasksConnector } from "../../src/connectors/personal/brief-tasks/connector.js";
import { connectorStatusStore } from "../../src/connectors/status.js";
import { resetConnectorRegistry, setConnectorRegistry } from "../../src/connectors/runtime.js";
import { briefStore } from "../../src/briefs/store.js";
import { createActionEngine } from "../../src/actions/engine.js";
import { InMemoryActionStore } from "../../src/actions/memory-store.js";
import { resetActionRuntime, setActionEngine, setActionStore } from "../../src/actions/runtime.js";
import { loadConfig, type BriefEnv } from "../../src/config.js";
import { InMemoryGraphStore } from "../../src/graph/memory-store.js";
import { resetGraphStore, setGraphStore } from "../../src/graph/runtime.js";
import { createApp } from "../../src/index.js";
import { InMemoryBriefTaskStore } from "../../src/tasks/memory-store.js";
import { resetBriefTaskRuntime, setBriefTaskStore } from "../../src/tasks/runtime.js";

export function installSmokeConnectors(store: InMemoryGraphStore): void {
  const registry = createConnectorRegistry(new ConnectorRunner(store));
  registry.register(new BriefTasksConnector());
  setConnectorRegistry(registry);
}

export function resetSmokeRuntime(): InMemoryGraphStore {
  resetGraphStore();
  resetConnectorRegistry();
  resetOAuthTokenStore();
  resetActionRuntime();
  resetBriefTaskRuntime();
  connectorStatusStore.clear();
  briefStore.clear();

  const store = new InMemoryGraphStore();
  setGraphStore(store);
  setOAuthTokenStore(new InMemoryOAuthTokenStore());

  const actionStore = new InMemoryActionStore();
  setActionStore(actionStore);
  setActionEngine(createActionEngine(actionStore));

  setBriefTaskStore(new InMemoryBriefTaskStore());

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
