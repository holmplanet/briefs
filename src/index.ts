import "dotenv/config";

import { fileURLToPath } from "node:url";

import type { Request, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { VERSION, loadConfig, type BriefEnv } from "./config.js";
import { createMcpApiTokenStore, registerStaticMcpTokens } from "./auth/mcp/factory.js";
import { mountMcpAuthRoutes } from "./auth/mcp/routes.js";
import { setMcpApiTokenStore } from "./auth/mcp/runtime.js";
import { BriefMcpTokenVerifier } from "./auth/mcp/verifier.js";
import { createUserIdResolver } from "./auth/mcp/resolve-user.js";
import { createActionEngine } from "./actions/engine.js";
import { createActionStore } from "./actions/store.js";
import { setActionEngine, setActionStore } from "./actions/runtime.js";
import { ConnectorRunner, createConnectorRegistry } from "./connectors/index.js";
import { registerPersonalConnectors } from "./connectors/personal/register.js";
import { getConnectorRegistry, setConnectorRegistry } from "./connectors/runtime.js";
import { createGraphStore } from "./graph/factory.js";
import { setGraphStore } from "./graph/runtime.js";
import { createMcpServer } from "./mcp/tools.js";
import { createBriefTaskStore } from "./tasks/store.js";
import { setBriefTaskStore } from "./tasks/runtime.js";

export async function bootstrap(): Promise<BriefEnv> {
  const config = loadConfig();
  const store = await createGraphStore(config);
  setGraphStore(store);

  const mcpTokenStore = await createMcpApiTokenStore(config);
  await registerStaticMcpTokens(mcpTokenStore, config.mcpAuth.staticTokens);
  setMcpApiTokenStore(mcpTokenStore);

  const actionStore = await createActionStore(config);
  setActionStore(actionStore);
  setActionEngine(createActionEngine(actionStore));

  const taskStore = await createBriefTaskStore(config);
  setBriefTaskStore(taskStore);

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

  mountMcpAuthRoutes(app, config);

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
      auth: {
        mcp: config.mcpAuth.enabled ? "required" : "disabled",
      },
      storage: {
        graph: config.databaseUrl ? "postgres" : "memory",
        cache: config.redisUrl ? "redis" : "none",
      },
      connectors,
    });
  });

  const resolveUserId = createUserIdResolver(config.mcpAuth);
  const mcpAuthMiddleware = config.mcpAuth.enabled
    ? requireBearerAuth({
        verifier: new BriefMcpTokenVerifier(config.mcpAuth),
      })
    : (_req: Request, _res: Response, next: () => void) => next();

  async function handleMcpRequest(req: Request, res: Response): Promise<void> {
    const server = createMcpServer({ resolveUserId });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  app.post(config.mcpPath, mcpAuthMiddleware, handleMcpRequest);
  app.get(config.mcpPath, mcpAuthMiddleware, handleMcpRequest);
  app.delete(config.mcpPath, mcpAuthMiddleware, handleMcpRequest);

  return app;
}

export async function startServer() {
  const config = await bootstrap();
  const app = createApp(config);

  app.listen(config.port, config.host, () => {
    console.log(`Holmplanet Brief listening on ${config.publicUrl}`);
    console.log(`Health: ${config.publicUrl}/health`);
    console.log(`MCP: ${config.publicUrl}${config.mcpPath}`);
    console.log(`MCP auth: ${config.mcpAuth.enabled ? "required" : "disabled"}`);
    console.log(
      `Graph: ${config.databaseUrl ? "postgres" : "memory"}${
        config.redisUrl ? " + redis cache" : ""
      }`,
    );
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
