import { randomUUID } from "node:crypto";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { ActionStatus, actionQueue } from "../actions/queue.js";
import { BriefKind, briefGenerator } from "../briefs/generator.js";
import { getGraphStore } from "../graph/runtime.js";
import { reasoningEngine } from "../reasoning/engine.js";

const briefKindSchema = z.enum([
  BriefKind.MORNING,
  BriefKind.AFTERNOON,
  BriefKind.ON_DEMAND,
  BriefKind.DELTA,
]);

const briefMeInput = z.object({
  userId: z.string().default("default"),
  kind: briefKindSchema.default(BriefKind.ON_DEMAND),
});

const whatChangedInput = z.object({
  userId: z.string().default("default"),
  since: z.string().optional(),
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

export function registerMcpTools(server: McpServer): void {
  server.registerTool(
    "brief_me",
    {
      description: "Generate the current brief for a user.",
      inputSchema: briefMeInput,
    },
    async ({ userId, kind }) => {
      const snapshot = await getGraphStore().getSnapshot(userId);
      const changes = reasoningEngine.analyze(snapshot);
      const brief = briefGenerator.generate(userId, kind, changes);
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
    },
    async ({ userId, since }) => {
      const snapshot = await getGraphStore().getSnapshot(userId);
      const changes = reasoningEngine.analyze(snapshot);
      const brief = briefGenerator.generate(userId, BriefKind.DELTA, changes);
      const payload = {
        since: since ?? "last_brief",
        checkedAt: new Date().toISOString(),
        brief,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
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
    },
    async ({ userId, actionType, summary, payload }) => {
      const proposal = actionQueue.propose({
        id: randomUUID(),
        userId,
        actionType,
        summary,
        payload,
        status: ActionStatus.PROPOSED,
        createdAt: new Date().toISOString(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(proposal, null, 2) }],
        structuredContent: proposal,
      };
    },
  );

  server.registerTool(
    "approve_action",
    {
      description: "Approve and execute a previously proposed action.",
      inputSchema: approveActionInput,
    },
    async ({ userId, actionId }) => {
      const proposal = actionQueue.get(actionId);
      if (!proposal) {
        const payload = { status: "error", message: "Action not found" };
        return {
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
          structuredContent: payload,
        };
      }
      if (proposal.userId !== userId) {
        const payload = { status: "error", message: "Action does not belong to user" };
        return {
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
          structuredContent: payload,
        };
      }
      const payload = {
        status: "not_implemented",
        message: "Execution wiring lands in issue #9",
        actionId,
      };
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
