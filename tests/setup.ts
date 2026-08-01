import { beforeEach } from "vitest";

import { InMemoryOAuthTokenStore } from "../src/auth/memory-token-store.js";
import { resetOAuthTokenStore, setOAuthTokenStore } from "../src/auth/runtime.js";
import { ConnectorRunner, createConnectorRegistry } from "../src/connectors/index.js";
import { connectorStatusStore } from "../src/connectors/status.js";
import { resetConnectorRegistry, setConnectorRegistry } from "../src/connectors/runtime.js";
import { InMemoryGraphStore } from "../src/graph/memory-store.js";
import { resetGraphStore, setGraphStore } from "../src/graph/runtime.js";

beforeEach(() => {
  resetGraphStore();
  resetConnectorRegistry();
  resetOAuthTokenStore();
  connectorStatusStore.clear();

  const store = new InMemoryGraphStore();
  setGraphStore(store);
  setOAuthTokenStore(new InMemoryOAuthTokenStore());
  setConnectorRegistry(createConnectorRegistry(new ConnectorRunner(store)));
});
