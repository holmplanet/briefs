import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { ItemStatus } from "@briefs/shared/item";

import { createBriefsApiClient } from "../briefs-client.js";
import { formatToolResult } from "./format.js";
import type { BriefsToolDeps, BriefsToolsConfig } from "./types.js";

const inputSchema = z
  .object({
    item_id: z.string().uuid(),
    name: z.string().min(1).optional(),
    kind: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    status: z.nativeEnum(ItemStatus).optional(),
    lifecycle: z.enum(["active", "archived"]).optional(),
  })
  .strict();

export function registerItemsUpdateTool(
  server: McpServer,
  deps: BriefsToolDeps,
  config: BriefsToolsConfig,
) {
  server.registerTool(
    "items_update",
    {
      description:
        "Update a Briefs item's fields or status, including its kind label. Use description for the Markdown-formatted body; set it to null to clear the body.",
      inputSchema,
    },
    async (args, extra) => {
      const auth = await deps.requireAccessToken(extra);
      const { item_id, ...patch } = args;

      try {
        const client = createBriefsApiClient(auth.userId, config.apiUrl, auth.token, config.headers, config.fetch);
        const item = await client.updateItem(item_id, patch);
        return formatToolResult({ item });
      } catch (error) {
        return formatToolResult(null, error);
      }
    },
  );
}
