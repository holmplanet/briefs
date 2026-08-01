import "dotenv/config";

import { fileURLToPath } from "node:url";

import type { Request, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { VERSION, loadConfig, type BriefEnv } from "./config.js";
import { createOAuthTokenStore } from "./auth/token-store.js";
import { setOAuthTokenStore } from "./auth/runtime.js";
import { mountGoogleAuthRoutes } from "./auth/routes.js";
import { createActionEngine } from "./actions/engine.js";
import { createActionStore } from "./actions/store.js";
import { setActionEngine, setActionStore } from "./actions/runtime.js";
import { ConnectorRunner, createConnectorRegistry } from "./connectors/index.js";
import { registerPersonalConnectors } from "./connectors/personal/register.js";
import { getConnectorRegistry, setConnectorRegistry } from "./connectors/runtime.js";
import { createGraphStore } from "./graph/factory.js";
import { setGraphStore } from "./graph/runtime.js";
import { createMcpServer } from "./mcp/tools.js";

export async function bootstrap(): Promise<BriefEnv> {
  const config = loadConfig();
  const store = await createGraphStore(config);
  setGraphStore(store);

  setOAuthTokenStore(await createOAuthTokenStore(config));

  const actionStore = await createActionStore(config);
  setActionStore(actionStore);
  setActionEngine(createActionEngine(actionStore));

  const registry = createConnectorRegistry(new ConnectorRunner(store));
  registerPersonalConnectors(registry, config);
  setConnectorRegistry(registry);

  return config;
}

export function createApp(config: BriefEnv) {
  const app = createMcpExpressApp({
    host: config.host,
    allowedHosts: ["localhost", "127.0.0.1", `${config.host}:${config.port}`],
  });

  mountGoogleAuthRoutes(app, config);

  app.get("/health", (_req: Request, res: Response) => {
    let connectors = 0;
    try {
      connectors = getConnectorRegistry().listNames().length;
    } catch {
      connectors = 0;
    }

    res.status(200).json({
      status: "ok",
      service: "holmplanet-brief",
      version: VERSION,
      transport: "stateless",
      storage: {
        graph: config.databaseUrl ? "postgres" : "memory",
        cache: config.redisUrl ? "redis" : "none",
      },
      connectors,
    });
  });

  async function handleMcpRequest(req: Request, res: Response): Promise<void> {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  app.post(config.mcpPath, handleMcpRequest);
  app.get(config.mcpPath, handleMcpRequest);
  app.delete(config.mcpPath, handleMcpRequest);

  return app;
}

export async function startServer() {
  const config = await bootstrap();
  const app = createApp(config);

  app.listen(config.port, config.host, () => {
    console.log(`Holmplanet Brief listening on ${config.publicUrl}`);
    console.log(`Health: ${config.publicUrl}/health`);
    console.log(`MCP: ${config.publicUrl}${config.mcpPath}`);
    console.log(
      `Graph: ${config.databaseUrl ? "postgres" : "memory"}${
        config.redisUrl ? " + redis cache" : ""
      }`,
    );
    if (config.google) {
      console.log(`Google OAuth: ${config.publicUrl}/auth/google/start?userId=<user-id>`);
      console.log(`Scopes: ${config.google.scopes.join(", ")}`);
    }
  });

  return app;
}

const entrypoint = fileURLToPath(import.meta.url);
if (process.argv[1] === entrypoint) {
  startServer().catch((error) => {
    console.error("Failed to start Brief:", error);
    process.exit(1);
  });
}
