import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { ItemStatus } from "@briefs/shared/item";

import { createBriefsApiClient } from "../briefs-client.js";
import { formatToolResult } from "./format.js";
import type { BriefsToolDeps, BriefsToolsConfig } from "./types.js";

const inputSchema = z
  .object({
    name: z.string().min(1),
    kind: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.nativeEnum(ItemStatus).optional(),
  })
  .strict();

export function registerItemsCreateTool(
  server: McpServer,
  deps: BriefsToolDeps,
  config: BriefsToolsConfig,
) {
  server.registerTool(
    "items_create",
    {
      description:
        "Create a durable Briefs item (task, note, commitment, etc.). Use description for the Markdown-formatted body that humans and agents should read.",
      inputSchema,
    },
    async (args, extra) => {
      const auth = await deps.requireAccessToken(extra);
      try {
        const client = createBriefsApiClient(auth.userId, config.apiUrl, auth.token);
        const item = await client.createItem({
          name: args.name,
          kind: args.kind,
          description: args.description,
          status: args.status,
        });
        return formatToolResult({ item });
      } catch (error) {
        return formatToolResult(null, error);
      }
    },
  );
}
