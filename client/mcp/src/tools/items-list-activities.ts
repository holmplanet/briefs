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

export function registerItemsListActivitiesTool(
  server: McpServer,
  deps: BriefsToolDeps,
  config: BriefsToolsConfig,
) {
  server.registerTool(
    "items_list_activities",
    {
      description: "List append-only activity log entries for a Briefs item.",
      inputSchema,
    },
    async (args, extra) => {
      const auth = await deps.requireAccessToken(extra);
      try {
        const client = createBriefsApiClient(auth.userId, config.apiUrl, auth.token);
        const activities = await client.listItemActivities(args.item_id);
        return formatToolResult({ activities, count: activities.length });
      } catch (error) {
        return formatToolResult(null, error);
      }
    },
  );
}
