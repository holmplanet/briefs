import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { McpToolExtra } from "../auth/mcp/resolve-user.js";
import { BriefKind } from "../briefs/generator.js";
import { TaskPriority, TaskStatus } from "../graph/tasks/protocol.js";
import { getGraphStore } from "../graph/runtime.js";
import { approveAction, listActions, proposeAction } from "./action-service.js";
import { ActionStatus } from "../actions/types.js";
import { generateBrief, generateDeltaBrief, syncConnectors } from "./brief-service.js";
import { createBriefTask, listBriefTasks, updateBriefTask } from "../tasks/service.js";

export type McpToolDeps = {
  resolveUserId: (extra: McpToolExtra, requestedUserId?: string) => string;
};

const briefKindSchema = z.enum([
  BriefKind.MORNING,
  BriefKind.AFTERNOON,
  BriefKind.ON_DEMAND,
  BriefKind.DELTA,
]);

const briefMeInput = z.object({
  userId: z.string().optional(),
  kind: briefKindSchema.default(BriefKind.ON_DEMAND),
  syncFirst: z.boolean().default(true),
});

const whatChangedInput = z.object({
  userId: z.string().optional(),
  since: z.string().optional(),
});

const syncConnectorsInput = z.object({
  userId: z.string().optional(),
});

const getContextInput = z.object({
  userId: z.string().optional(),
  topic: z.string().optional(),
});

const proposeActionInput = z.object({
  userId: z.string().optional(),
  actionType: z.string(),
  summary: z.string(),
  payload: z.record(z.unknown()).default({}),
});

const approveActionInput = z.object({
  userId: z.string().optional(),
  actionId: z.string(),
});

const listActionsInput = z.object({
  userId: z.string().optional(),
  status: z.enum([
    ActionStatus.PROPOSED,
    ActionStatus.APPROVED,
    ActionStatus.EXECUTED,
    ActionStatus.REJECTED,
    ActionStatus.FAILED,
  ]).optional(),
});

const taskStatusSchema = z.enum([
  TaskStatus.OPEN,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
  TaskStatus.CANCELLED,
]);

const taskPrioritySchema = z.enum([
  TaskPriority.LOW,
  TaskPriority.NORMAL,
  TaskPriority.HIGH,
  TaskPriority.URGENT,
]);

const briefTaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  label: z.string(),
  status: taskStatusSchema,
  dueAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  completedAt: z.string().optional(),
  priority: taskPrioritySchema.optional(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const listTasksInput = z.object({
  userId: z.string().optional(),
  status: taskStatusSchema.optional(),
});

const createTaskInput = z.object({
  userId: z.string().optional(),
  label: z.string(),
  dueAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  priority: taskPrioritySchema.optional(),
  description: z.string().optional(),
});

const updateTaskInput = z.object({
  userId: z.string().optional(),
  taskId: z.string(),
  label: z.string().optional(),
  status: taskStatusSchema.optional(),
  dueAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  priority: taskPrioritySchema.nullable().optional(),
  description: z.string().nullable().optional(),
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

export function registerMcpTools(server: McpServer, deps: McpToolDeps): void {
  server.registerTool(
    "sync_connectors",
    {
      description: "Sync all registered connectors (calendar, weather, etc.) into the Event Graph.",
      inputSchema: syncConnectorsInput,
    },
    async ({ userId }, extra) => {
      const resolvedUserId = deps.resolveUserId(extra, userId);
      const reports = await syncConnectors(resolvedUserId);
      const payload = { userId: resolvedUserId, reports };
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
    async ({ userId, kind, syncFirst }, extra) => {
      const resolvedUserId = deps.resolveUserId(extra, userId);
      const brief = await generateBrief(resolvedUserId, kind, { syncFirst });
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
    async ({ userId, since }, extra) => {
      const resolvedUserId = deps.resolveUserId(extra, userId);
      const payload = await generateDeltaBrief(resolvedUserId, since);
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
    async ({ userId, topic }, extra) => {
      const resolvedUserId = deps.resolveUserId(extra, userId);
      const snapshot = await getGraphStore().getSnapshot(resolvedUserId);
      const nodes = topic
        ? snapshot.nodes.filter((node) => node.label.toLowerCase().includes(topic.toLowerCase()))
        : snapshot.nodes;
      const payload = {
        userId: resolvedUserId,
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
    async ({ userId, actionType, summary, payload }, extra) => {
      const resolvedUserId = deps.resolveUserId(extra, userId);
      const proposal = await proposeAction({
        userId: resolvedUserId,
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
    async ({ userId, status }, extra) => {
      const resolvedUserId = deps.resolveUserId(extra, userId);
      const actions = await listActions(resolvedUserId, status);
      const payload = { userId: resolvedUserId, actions };
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
    async ({ userId, actionId }, extra) => {
      const resolvedUserId = deps.resolveUserId(extra, userId);
      const payload = await approveAction(resolvedUserId, actionId);
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
      };
    },
  );

  server.registerTool(
    "list_tasks",
    {
      description: "List Brief-native tasks for a user.",
      inputSchema: listTasksInput,
      outputSchema: z.object({
        userId: z.string(),
        tasks: z.array(briefTaskSchema),
      }),
    },
    async ({ userId, status }, extra) => {
      const resolvedUserId = deps.resolveUserId(extra, userId);
      const tasks = await listBriefTasks(resolvedUserId, status);
      const payload = { userId: resolvedUserId, tasks };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
      };
    },
  );

  server.registerTool(
    "create_task",
    {
      description: "Create a Brief-native task and sync it into the Event Graph.",
      inputSchema: createTaskInput,
      outputSchema: briefTaskSchema,
    },
    async ({ userId, label, dueAt, scheduledAt, priority, description }, extra) => {
      const resolvedUserId = deps.resolveUserId(extra, userId);
      const task = await createBriefTask({
        userId: resolvedUserId,
        label,
        dueAt,
        scheduledAt,
        priority,
        description,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
        structuredContent: task,
      };
    },
  );

  server.registerTool(
    "update_task",
    {
      description: "Update a Brief-native task and sync changes into the Event Graph.",
      inputSchema: updateTaskInput,
      outputSchema: briefTaskSchema,
    },
    async ({ userId, taskId, ...updates }, extra) => {
      const resolvedUserId = deps.resolveUserId(extra, userId);
      const task = await updateBriefTask(resolvedUserId, taskId, updates);
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
        structuredContent: task,
      };
    },
  );
}

export function createMcpServer(deps: McpToolDeps): McpServer {
  const server = new McpServer({
    name: "holmplanet-brief",
    version: "0.1.0",
  });
  registerMcpTools(server, deps);
  return server;
}
