import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { createBriefsApiClient } from "../briefs-client.js";
import { formatToolResult } from "./format.js";
import type { BriefsToolDeps, BriefsToolsConfig } from "./types.js";

const inputSchema = z.object({
  kind: z.enum(["morning", "on_demand"]).default("on_demand"),
}).strict();

export function registerBriefMeTool(
  server: McpServer,
  deps: BriefsToolDeps,
  config: BriefsToolsConfig,
) {
  server.registerTool(
    "brief_me",
    {
      description: "Create a concise Briefs summary from active tasks and ingested context.",
      inputSchema,
    },
    async (args, extra) => {
      const auth = await deps.requireAccessToken(extra);
      try {
        const client = createBriefsApiClient(auth.userId, config.apiUrl, auth.token, config.headers);
        const items = (await client.listItems()).filter((item) => item.lifecycle === "active");
        const prioritized = items
          .filter((item) => item.kind !== "event" || item.scheduledAt)
          .sort((left, right) => (left.scheduledAt ?? left.dueAt ?? "").localeCompare(right.scheduledAt ?? right.dueAt ?? ""));
        const summary = prioritized.length === 0
          ? "No active work or upcoming context is currently on the plate."
          : prioritized.map((item) => `${item.kind}: ${item.name}${item.scheduledAt ? ` (${item.scheduledAt})` : ""}`).join("; ");
        const brief = await client.createBrief({
          kind: args.kind,
          headline: args.kind === "morning" ? "Your morning Brief" : "Your current Brief",
          summary,
          itemIds: prioritized.map((item) => item.id),
        });
        return formatToolResult({ brief, items: prioritized, counts: { total: items.length } });
      } catch (error) {
        return formatToolResult(null, error);
      }
    },
  );
}
