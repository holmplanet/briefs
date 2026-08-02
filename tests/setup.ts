import { beforeEach } from "vitest";

import { createActionEngine } from "../src/actions/engine.js";
import { InMemoryActionStore } from "../src/actions/memory-store.js";
import { resetActionRuntime, setActionEngine, setActionStore } from "../src/actions/runtime.js";
import { InMemoryMcpApiTokenStore } from "../src/auth/mcp/memory-store.js";
import { resetMcpApiTokenStore, setMcpApiTokenStore } from "../src/auth/mcp/runtime.js";
import { InMemoryOAuthTokenStore } from "../src/auth/memory-token-store.js";
import { resetOAuthTokenStore, setOAuthTokenStore } from "../src/auth/runtime.js";
import { ConnectorRunner, createConnectorRegistry } from "../src/connectors/index.js";
import { connectorStatusStore } from "../src/connectors/status.js";
import { resetConnectorRegistry, setConnectorRegistry } from "../src/connectors/runtime.js";
import { InMemoryGraphStore } from "../src/graph/memory-store.js";
import { resetGraphStore, setGraphStore } from "../src/graph/runtime.js";

beforeEach(() => {
  process.env.BRIEF_MCP_AUTH_DISABLED = "true";
  process.env.BRIEF_MCP_AUTH_ENABLED = "false";

  resetGraphStore();
  resetConnectorRegistry();
  resetOAuthTokenStore();
  resetActionRuntime();
  resetMcpApiTokenStore();
  connectorStatusStore.clear();

  const store = new InMemoryGraphStore();
  setGraphStore(store);
  setOAuthTokenStore(new InMemoryOAuthTokenStore());

  const actionStore = new InMemoryActionStore();
  setActionStore(actionStore);
  setActionEngine(createActionEngine(actionStore));

  setMcpApiTokenStore(new InMemoryMcpApiTokenStore());

  setConnectorRegistry(createConnectorRegistry(new ConnectorRunner(store)));
});
