import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { ActorType } from "@briefs/shared/actor";

import { createBriefsApiClient } from "../briefs-client.js";
import { formatToolResult } from "./format.js";
import type { BriefsToolDeps, BriefsToolsConfig } from "./types.js";

const contextNodeSchema = z.object({
  externalId: z.string().min(1),
  kind: z.string().min(1).default("event"),
  name: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  outdoor: z.boolean().optional(),
  htmlLink: z.string().url().optional(),
}).strict();

const inputSchema = z.object({
  source: z.string().min(1),
  nodes: z.array(contextNodeSchema).min(1),
}).strict();

export function registerIngestContextTool(
  server: McpServer,
  deps: BriefsToolDeps,
  config: BriefsToolsConfig,
) {
  server.registerTool(
    "ingest_context",
    {
      description: "Ingest normalized external context nodes into Briefs with stable source deduplication.",
      inputSchema,
    },
    async (args, extra) => {
      const auth = await deps.requireAccessToken(extra);
      try {
        const client = createBriefsApiClient(auth.userId, config.apiUrl, auth.token, config.headers, config.fetch);
        const recordedAt = new Date().toISOString();
        const items = await Promise.all(args.nodes.map((node) => client.createItem({
          name: node.name,
          kind: node.kind,
          description: [
            node.description,
            node.location ? `Location: ${node.location}` : undefined,
            node.outdoor ? "Outdoor event" : undefined,
            node.htmlLink ? `Calendar link: ${node.htmlLink}` : undefined,
          ].filter(Boolean).join("\n") || undefined,
          scheduledAt: node.startsAt,
          occurredAt: node.startsAt <= recordedAt ? node.startsAt : recordedAt,
          context: "external",
          source: { system: args.source, externalId: node.externalId },
          performer: {
            kind: ActorType.SERVICE,
            identity: `briefs:ingest:${args.source}`,
            name: "Briefs context ingest",
          },
        })));
        return formatToolResult({ source: args.source, items, count: items.length });
      } catch (error) {
        return formatToolResult(null, error);
      }
    },
  );
}
