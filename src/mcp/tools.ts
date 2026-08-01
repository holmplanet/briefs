import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { BriefKind } from "../briefs/generator.js";
import { getGraphStore } from "../graph/runtime.js";
import { approveAction, listActions, proposeAction } from "./action-service.js";
import { ActionStatus } from "../actions/types.js";
import { generateBrief, generateDeltaBrief, syncConnectors } from "./brief-service.js";

const briefKindSchema = z.enum([
  BriefKind.MORNING,
  BriefKind.AFTERNOON,
  BriefKind.ON_DEMAND,
  BriefKind.DELTA,
]);

const briefMeInput = z.object({
  userId: z.string().default("default"),
  kind: briefKindSchema.default(BriefKind.ON_DEMAND),
  syncFirst: z.boolean().default(true),
});

const whatChangedInput = z.object({
  userId: z.string().default("default"),
  since: z.string().optional(),
});

const syncConnectorsInput = z.object({
  userId: z.string().default("default"),
});

const getContextInput = z.object({
  userId: z.string().default("default"),
  topic: z.string().optional(),
});

const proposeActionInput = z.object({
  userId: z.string(),
  actionType: z.string(),
  summary: z.string(),
  payload: z.record(z.unknown()).default({}),
});

const approveActionInput = z.object({
  userId: z.string(),
  actionId: z.string(),
});

const listActionsInput = z.object({
  userId: z.string(),
  status: z.enum([
    ActionStatus.PROPOSED,
    ActionStatus.APPROVED,
    ActionStatus.EXECUTED,
    ActionStatus.REJECTED,
    ActionStatus.FAILED,
  ]).optional(),
});

const actionProposalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  actionType: z.string(),
  summary: z.string(),
  payload: z.record(z.unknown()),
  status: z.enum([
    ActionStatus.PROPOSED,
    ActionStatus.APPROVED,
    ActionStatus.EXECUTED,
    ActionStatus.REJECTED,
    ActionStatus.FAILED,
  ]),
  createdAt: z.string(),
  approvedAt: z.string().optional(),
  executedAt: z.string().optional(),
  rejectedAt: z.string().optional(),
  result: z
    .object({
      mode: z.literal("draft"),
      actionType: z.string(),
      summary: z.string(),
      message: z.string(),
      draft: z.record(z.unknown()),
    })
    .optional(),
  error: z.string().optional(),
});

const briefOutputSchema = z.object({
  userId: z.string(),
  kind: briefKindSchema,
  generatedAt: z.string(),
  greeting: z.string(),
  bullets: z.array(
    z.object({
      text: z.string(),
      priority: z.number(),
    }),
  ),
});

export function registerMcpTools(server: McpServer): void {
  server.registerTool(
    "sync_connectors",
    {
      description: "Sync all registered connectors (calendar, weather, etc.) into the Event Graph.",
      inputSchema: syncConnectorsInput,
    },
    async ({ userId }) => {
      const reports = await syncConnectors(userId);
      const payload = { userId, reports };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
      };
    },
  );

  server.registerTool(
    "brief_me",
    {
      description:
        "Generate the current brief for a user. Syncs connectors first by default, then reasons over the Event Graph.",
      inputSchema: briefMeInput,
      outputSchema: briefOutputSchema,
    },
    async ({ userId, kind, syncFirst }) => {
      const brief = await generateBrief(userId, kind, { syncFirst });
      return {
        content: [{ type: "text", text: JSON.stringify(brief, null, 2) }],
        structuredContent: brief,
      };
    },
  );

  server.registerTool(
    "what_changed",
    {
      description: "Return changes since the last brief or an explicit ISO timestamp.",
      inputSchema: whatChangedInput,
      outputSchema: z.object({
        since: z.string(),
        checkedAt: z.string(),
        previousBriefAt: z.string().optional(),
        brief: briefOutputSchema,
      }),
    },
    async ({ userId, since }) => {
      const payload = await generateDeltaBrief(userId, since);
      const { changeSet: _changeSet, ...structured } = payload;
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        structuredContent: structured,
      };
    },
  );

  server.registerTool(
    "get_context",
    {
      description: "Fetch a graph slice for a person, event, or topic.",
      inputSchema: getContextInput,
    },
    async ({ userId, topic }) => {
      const snapshot = await getGraphStore().getSnapshot(userId);
      const nodes = topic
        ? snapshot.nodes.filter((node) => node.label.toLowerCase().includes(topic.toLowerCase()))
        : snapshot.nodes;
      const payload = {
        userId,
        topic: topic ?? null,
        nodeCount: nodes.length,
        nodes,
        edgeCount: snapshot.edges.length,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
      };
    },
  );

  server.registerTool(
    "propose_action",
    {
      description: "Recommend an action that requires user approval before execution.",
      inputSchema: proposeActionInput,
      outputSchema: actionProposalSchema,
    },
    async ({ userId, actionType, summary, payload }) => {
      const proposal = await proposeAction({
        userId,
        actionType,
        summary,
        payload,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(proposal, null, 2) }],
        structuredContent: proposal,
      };
    },
  );

  server.registerTool(
    "list_actions",
    {
      description: "List proposed or executed actions for a user.",
      inputSchema: listActionsInput,
      outputSchema: z.object({
        userId: z.string(),
        actions: z.array(actionProposalSchema),
      }),
    },
    async ({ userId, status }) => {
      const actions = await listActions(userId, status);
      const payload = { userId, actions };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
      };
    },
  );

  server.registerTool(
    "approve_action",
    {
      description: "Approve and execute a previously proposed action.",
      inputSchema: approveActionInput,
      outputSchema: z
        .object({
          status: z.string(),
        })
        .passthrough(),
    },
    async ({ userId, actionId }) => {
      const payload = await approveAction(userId, actionId);
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
      };
    },
  );
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "holmplanet-brief",
    version: "0.1.0",
  });
  registerMcpTools(server);
  return server;
}
