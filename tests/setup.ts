import { beforeEach } from "vitest";

import { ConnectorRunner, createConnectorRegistry } from "../src/connectors/index.js";
import { connectorStatusStore } from "../src/connectors/status.js";
import { resetConnectorRegistry, setConnectorRegistry } from "../src/connectors/runtime.js";
import { InMemoryGraphStore } from "../src/graph/memory-store.js";
import { resetGraphStore, setGraphStore } from "../src/graph/runtime.js";

beforeEach(() => {
  resetGraphStore();
  resetConnectorRegistry();
  connectorStatusStore.clear();

  const store = new InMemoryGraphStore();
  setGraphStore(store);
  setConnectorRegistry(createConnectorRegistry(new ConnectorRunner(store)));
});
