import "dotenv/config";

import { fileURLToPath } from "node:url";

import type { Request, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { VERSION, loadConfig } from "./config.js";
import { createMcpServer } from "./mcp/tools.js";

export function createApp() {
  const config = loadConfig();
  const app = createMcpExpressApp({
    host: config.host,
    allowedHosts: ["localhost", "127.0.0.1", `${config.host}:${config.port}`],
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "holmplanet-brief",
      version: VERSION,
      transport: "stateless",
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

  return { app, config };
}

export function startServer() {
  const { app, config } = createApp();

  app.listen(config.port, config.host, () => {
    console.log(`Holmplanet Brief listening on ${config.publicUrl}`);
    console.log(`Health: ${config.publicUrl}/health`);
    console.log(`MCP: ${config.publicUrl}${config.mcpPath}`);
  });

  return app;
}

const entrypoint = fileURLToPath(import.meta.url);
if (process.argv[1] === entrypoint) {
  startServer();
}
