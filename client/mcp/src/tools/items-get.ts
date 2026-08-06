import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { createBriefsApiClient } from "../briefs-client.js";
import { formatToolResult } from "./format.js";
import type { BriefsToolDeps, BriefsToolsConfig } from "./types.js";

const inputSchema = z
  .object({
    item_id: z.string().uuid(),
  })
  .strict();

export function registerItemsGetTool(
  server: McpServer,
  deps: BriefsToolDeps,
  config: BriefsToolsConfig,
) {
  server.registerTool(
    "items_get",
    {
      description: "Get a single Briefs item by id.",
      inputSchema,
    },
    async (args, extra) => {
      const auth = await deps.requireAccessToken(extra);
      try {
        const client = createBriefsApiClient(auth.userId, config.apiUrl);
        const item = await client.getItem(args.item_id);
        return formatToolResult({ item });
      } catch (error) {
        return formatToolResult(null, error);
      }
    },
  );
}
