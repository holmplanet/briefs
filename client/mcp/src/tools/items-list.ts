import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { ItemStatus } from "@briefs/shared/item";

import { createBriefsApiClient } from "../briefs-client.js";
import { formatToolResult } from "./format.js";
import type { BriefsToolDeps, BriefsToolsConfig } from "./types.js";

const inputSchema = z
  .object({
    status: z.nativeEnum(ItemStatus).optional(),
  })
  .strict();

export function registerItemsListTool(
  server: McpServer,
  deps: BriefsToolDeps,
  config: BriefsToolsConfig,
) {
  server.registerTool(
    "items_list",
    {
      description: "List durable Briefs items for the authenticated user.",
      inputSchema,
    },
    async (args, extra) => {
      const auth = await deps.requireAccessToken(extra);
      try {
        const client = createBriefsApiClient(auth.userId, config.apiUrl, auth.token, config.headers, config.fetch);
        const items = await client.listItems(args.status);
        return formatToolResult({ items, count: items.length });
      } catch (error) {
        return formatToolResult(null, error);
      }
    },
  );
}
