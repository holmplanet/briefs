import { beforeEach } from "vitest";

import { createActionEngine } from "../src/actions/engine.js";
import { InMemoryActionStore } from "../src/actions/memory-store.js";
import { resetActionRuntime, setActionEngine, setActionStore } from "../src/actions/runtime.js";
import { InMemoryMcpApiTokenStore } from "../src/auth/mcp/memory-store.js";
import { resetMcpApiTokenStore, setMcpApiTokenStore } from "../src/auth/mcp/runtime.js";
import { ConnectorRunner, createConnectorRegistry } from "../src/connectors/index.js";
import { BriefTasksConnector } from "../src/connectors/personal/brief-tasks/connector.js";
import { connectorStatusStore } from "../src/connectors/status.js";
import { resetConnectorRegistry, setConnectorRegistry } from "../src/connectors/runtime.js";
import { InMemoryGraphStore } from "../src/graph/memory-store.js";
import { resetGraphStore, setGraphStore } from "../src/graph/runtime.js";
import { InMemoryBriefTaskStore } from "../src/tasks/memory-store.js";
import { resetBriefTaskRuntime, setBriefTaskStore } from "../src/tasks/runtime.js";

beforeEach(() => {
  process.env.BRIEF_MCP_AUTH_DISABLED = "true";
  process.env.BRIEF_MCP_AUTH_ENABLED = "false";

  resetGraphStore();
  resetConnectorRegistry();
  resetActionRuntime();
  resetMcpApiTokenStore();
  resetBriefTaskRuntime();
  connectorStatusStore.clear();

  const store = new InMemoryGraphStore();
  setGraphStore(store);

  const actionStore = new InMemoryActionStore();
  setActionStore(actionStore);
  setActionEngine(createActionEngine(actionStore));

  setBriefTaskStore(new InMemoryBriefTaskStore());

  setMcpApiTokenStore(new InMemoryMcpApiTokenStore());

  const registry = createConnectorRegistry(new ConnectorRunner(store));
  registry.register(new BriefTasksConnector());
  setConnectorRegistry(registry);
});
