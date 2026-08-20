import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerBriefsTools } from "./tools/index.js";
import type { BriefsMcpAuth } from "./tools/types.js";

export function createBriefsMcpServer(
  user: BriefsMcpAuth,
  apiUrl?: string,
  options: { headers?: Record<string, string>; fetch?: typeof fetch } = {},
): McpServer {
  const server = new McpServer({ name: "briefs-mcp", version: "0.1.0" });
  registerBriefsTools(server, { requireAccessToken: async () => user }, {
    apiUrl,
    headers: options.headers,
    fetch: options.fetch,
  });
  return server;
}
