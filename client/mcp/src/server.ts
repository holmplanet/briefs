import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerBriefsTools } from "./tools/index.js";
import type { BriefsMcpAuth } from "./tools/types.js";

export function createBriefsMcpServer(user: BriefsMcpAuth, apiUrl?: string): McpServer {
  const server = new McpServer({ name: "briefs-mcp", version: "0.1.0" });
  registerBriefsTools(server, { requireAccessToken: async () => user }, { apiUrl });
  return server;
}
