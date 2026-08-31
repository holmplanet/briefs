import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { itemSchema } from "@briefs/shared/item";

import { createBriefsApiClient } from "../briefs-client.js";
import { formatToolResult } from "./format.js";
import type { BriefsToolDeps, BriefsToolsConfig } from "./types.js";

const inputSchema = z.object({
  kind: z.enum(["morning", "on_demand"]).default("on_demand"),
}).strict();

const briefItemSchema = itemSchema.pick({
  id: true,
  name: true,
  kind: true,
  status: true,
  priority: true,
  dueAt: true,
  scheduledAt: true,
  description: true,
});

const briefSectionSchema = z.object({
  inProgress: z.array(briefItemSchema),
  scheduledToday: z.array(briefItemSchema),
  dueToday: z.array(briefItemSchema),
  overdue: z.array(briefItemSchema),
  open: z.array(briefItemSchema),
  upcoming: z.array(briefItemSchema),
}).strict();

const briefMeOutputSchema = z.object({
  data: z.object({
    brief: z.object({
      schemaVersion: z.literal(1),
      id: z.string().uuid(),
      userId: z.string().min(1),
      kind: z.enum(["morning", "on_demand"]),
      headline: z.string().min(1),
      summary: z.string().min(1),
      itemIds: z.array(z.string().uuid()),
      createdAt: z.string().datetime(),
    }).strict(),
    overview: z.string().min(1),
    nextActions: z.array(z.object({
      itemId: z.string().uuid(),
      label: z.string().min(1),
      reason: z.string().min(1),
    }).strict()),
    sections: briefSectionSchema,
    counts: z.object({
      active: z.number().int().nonnegative(),
      open: z.number().int().nonnegative(),
      inProgress: z.number().int().nonnegative(),
      scheduledToday: z.number().int().nonnegative(),
      dueToday: z.number().int().nonnegative(),
      overdue: z.number().int().nonnegative(),
      completed: z.number().int().nonnegative(),
    }).strict(),
    items: z.array(briefItemSchema),
  }).strict(),
  error: z.null(),
}).strict();

type BriefItem = z.infer<typeof briefItemSchema>;

function dateKey(value: string | undefined): string | undefined {
  return value?.slice(0, 10);
}

function sortItems(items: BriefItem[]): BriefItem[] {
  return [...items].sort((left, right) =>
    (left.scheduledAt ?? left.dueAt ?? "").localeCompare(right.scheduledAt ?? right.dueAt ?? "")
    || left.name.localeCompare(right.name),
  );
}

function buildBriefSummary(items: BriefItem[], today: string) {
  const now = new Date().toISOString();
  const active = items.filter((item) => item.status === "open" || item.status === "in_progress");
  const inProgress = sortItems(active.filter((item) => item.status === "in_progress"));
  const scheduledToday = sortItems(active.filter((item) => dateKey(item.scheduledAt) === today));
  const dueToday = sortItems(active.filter((item) => dateKey(item.dueAt) === today));
  const overdue = sortItems(active.filter((item) => item.dueAt !== undefined && item.dueAt < now && dateKey(item.dueAt) !== today));
  const upcoming = sortItems(active.filter((item) =>
    (dateKey(item.scheduledAt) ?? "") > today
    || (dateKey(item.dueAt) ?? "") > today,
  ));
  const used = new Set([
    ...inProgress.map((item) => item.id),
    ...scheduledToday.map((item) => item.id),
    ...dueToday.map((item) => item.id),
    ...overdue.map((item) => item.id),
    ...upcoming.map((item) => item.id),
  ]);
  const open = sortItems(active.filter((item) => !used.has(item.id)));
  const nextActions = [
    ...inProgress.map((item) => ({ itemId: item.id, label: item.name, reason: "Already in progress" })),
    ...overdue.map((item) => ({ itemId: item.id, label: item.name, reason: "Overdue" })),
    ...scheduledToday.map((item) => ({ itemId: item.id, label: item.name, reason: "Scheduled today" })),
    ...dueToday.map((item) => ({ itemId: item.id, label: item.name, reason: "Due today" })),
  ].slice(0, 5);
  const overviewParts = [
    `${active.length} active item${active.length === 1 ? "" : "s"}`,
    inProgress.length > 0 ? `${inProgress.length} in progress` : null,
    scheduledToday.length > 0 ? `${scheduledToday.length} scheduled today` : null,
    overdue.length > 0 ? `${overdue.length} overdue` : null,
  ].filter(Boolean);

  return {
    overview: `${overviewParts.join(", ") || "No active work"}.`,
    nextActions,
    sections: { inProgress, scheduledToday, dueToday, overdue, open, upcoming },
    counts: {
      active: active.length,
      open: active.filter((item) => item.status === "open").length,
      inProgress: inProgress.length,
      scheduledToday: scheduledToday.length,
      dueToday: dueToday.length,
      overdue: overdue.length,
      completed: items.filter((item) => item.status === "done").length,
    },
  };
}

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
      outputSchema: briefMeOutputSchema,
    },
    async (args, extra) => {
      const auth = await deps.requireAccessToken(extra);
      try {
        const client = createBriefsApiClient(auth.userId, config.apiUrl, auth.token, config.headers, config.fetch);
        const items = (await client.listItems()).filter((item) => item.lifecycle === "active");
        const briefItems = items.map((item) => ({
          id: item.id,
          name: item.name,
          kind: item.kind,
          status: item.status,
          priority: item.priority,
          dueAt: item.dueAt,
          scheduledAt: item.scheduledAt,
          description: item.description,
        }));
        const today = new Date().toISOString().slice(0, 10);
        const details = buildBriefSummary(briefItems, today);
        const prioritized = [
          ...details.sections.inProgress,
          ...details.sections.overdue,
          ...details.sections.scheduledToday,
          ...details.sections.dueToday,
          ...details.sections.open,
          ...details.sections.upcoming,
        ];
        const summary = details.overview;
        const brief = await client.createBrief({
          kind: args.kind,
          headline: args.kind === "morning" ? "Your morning Brief" : "Your current Brief",
          summary,
          itemIds: prioritized.map((item) => item.id),
        });
        return formatToolResult({
          brief,
          overview: details.overview,
          nextActions: details.nextActions,
          sections: details.sections,
          counts: details.counts,
          items: prioritized,
        });
      } catch (error) {
        return formatToolResult(null, error);
      }
    },
  );
}
