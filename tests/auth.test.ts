import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { createActionEngine } from "../src/actions/engine.js";
import { InMemoryActionStore } from "../src/actions/memory-store.js";
import { resetActionRuntime, setActionEngine, setActionStore } from "../src/actions/runtime.js";
import { createMcpApiToken } from "../src/auth/mcp/factory.js";
import { InMemoryMcpApiTokenStore } from "../src/auth/mcp/memory-store.js";
import { getMcpApiTokenStore, resetMcpApiTokenStore, setMcpApiTokenStore } from "../src/auth/mcp/runtime.js";
import { createUserIdResolver } from "../src/auth/mcp/resolve-user.js";
import { InMemoryOAuthTokenStore } from "../src/auth/memory-token-store.js";
import { resetOAuthTokenStore, setOAuthTokenStore } from "../src/auth/runtime.js";
import { ConnectorRunner, createConnectorRegistry } from "../src/connectors/index.js";
import { connectorStatusStore } from "../src/connectors/status.js";
import { resetConnectorRegistry, setConnectorRegistry } from "../src/connectors/runtime.js";
import { loadConfig } from "../src/config.js";
import { NodeKind } from "../src/graph/models.js";
import { InMemoryGraphStore } from "../src/graph/memory-store.js";
import { getGraphStore, resetGraphStore, setGraphStore } from "../src/graph/runtime.js";
import { bootstrap, createApp } from "../src/index.js";

const ORIGINAL_ENV = { ...process.env };

function authExtra(userId: string) {
  return {
    authInfo: {
      token: "test-token",
      clientId: "brief-api-token",
      scopes: ["mcp"],
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      extra: { userId },
    },
  };
}

describe("mcp auth", () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      BRIEF_MCP_AUTH_DISABLED: "false",
      BRIEF_MCP_AUTH_ENABLED: "true",
      BRIEF_ENV: "development",
      BRIEF_AUTH_ADMIN_SECRET: "test-admin-secret",
    };

    resetGraphStore();
    resetConnectorRegistry();
    resetOAuthTokenStore();
    resetActionRuntime();
    resetMcpApiTokenStore();
    connectorStatusStore.clear();

    setOAuthTokenStore(new InMemoryOAuthTokenStore());
    setMcpApiTokenStore(new InMemoryMcpApiTokenStore());

    const actionStore = new InMemoryActionStore();
    setActionStore(actionStore);
    setActionEngine(createActionEngine(actionStore));
    setConnectorRegistry(createConnectorRegistry(new ConnectorRunner(new InMemoryGraphStore())));
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("rejects unauthenticated MCP requests when auth is enabled", async () => {
    const config = await bootstrap();
    const app = createApp(config);
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected server port");
    }

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}${config.mcpPath}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });
      expect(response.status).toBe(401);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("binds MCP tools to the authenticated user and rejects mismatched userId", () => {
    const resolveUserId = createUserIdResolver(loadConfig().mcpAuth);
    const extra = authExtra("user-a");

    expect(resolveUserId(extra as never, "user-a")).toBe("user-a");
    expect(resolveUserId(extra as never)).toBe("user-a");
    expect(() => resolveUserId(extra as never, "user-b")).toThrow(
      /does not match authenticated user/,
    );
  });

  it("keeps graph snapshots isolated per user", async () => {
    const store = new InMemoryGraphStore();
    setGraphStore(store);

    await store.upsertNode({
      id: "event-a",
      userId: "user-a",
      kind: NodeKind.EVENT,
      label: "User A meeting",
      data: {},
      updatedAt: new Date().toISOString(),
    });
    await store.upsertNode({
      id: "event-b",
      userId: "user-b",
      kind: NodeKind.EVENT,
      label: "User B meeting",
      data: {},
      updatedAt: new Date().toISOString(),
    });

    const snapshotA = await getGraphStore().getSnapshot("user-a");
    const snapshotB = await getGraphStore().getSnapshot("user-b");

    expect(snapshotA.nodes).toHaveLength(1);
    expect(snapshotB.nodes).toHaveLength(1);
    expect(snapshotA.nodes[0]?.label).toBe("User A meeting");
    expect(snapshotB.nodes[0]?.label).toBe("User B meeting");
  });

  it("accepts bearer tokens over MCP HTTP", async () => {
    const config = await bootstrap();
    const token = await createMcpApiToken(getMcpApiTokenStore(), { userId: "user-a" });
    const app = createApp(config);
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected server port");
    }

    const client = new Client({ name: "auth-test", version: "0.1.0" });
    const transport = new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${address.port}${config.mcpPath}`),
      {
        requestInit: {
          headers: {
            Authorization: `Bearer ${token.token}`,
          },
        },
      },
    );

    try {
      await client.connect(transport);
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toContain("get_context");
    } finally {
      await client.close();
      await transport.close();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("creates API tokens with the admin secret", async () => {
    const config = await bootstrap();
    const app = createApp(config);
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected server port");
    }

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/auth/tokens`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-brief-admin-secret": "test-admin-secret",
        },
        body: JSON.stringify({ userId: "user-a", label: "ci" }),
      });
      expect(response.status).toBe(201);
      const payload = await response.json();
      expect(payload.userId).toBe("user-a");
      expect(payload.token).toMatch(/^brief_/);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
