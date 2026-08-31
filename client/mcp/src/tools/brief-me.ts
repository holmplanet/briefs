import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { itemSchema } from "@briefs/shared/item";

import { createBriefsApiClient } from "../briefs-client.js";
import { formatToolResult } from "./format.js";
import type { BriefsToolDeps, BriefsToolsConfig } from "./types.js";

const inputSchema = z.object({
  kind: z.enum(["morning", "on_demand"]).default("on_demand"),
  timezone: z.string().min(1).default("UTC"),
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

const priorityRank: Record<NonNullable<BriefItem["priority"]>, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function dateKey(value: string | undefined, timezone: string): string | undefined {
  if (!value) return undefined;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function sortItems(items: BriefItem[]): BriefItem[] {
  return [...items].sort((left, right) =>
    (left.scheduledAt ?? left.dueAt ?? "").localeCompare(right.scheduledAt ?? right.dueAt ?? "")
    || left.name.localeCompare(right.name),
  );
}

function sortOpenItems(items: BriefItem[]): BriefItem[] {
  return [...items].sort((left, right) =>
    priorityRank[left.priority ?? "normal"] - priorityRank[right.priority ?? "normal"]
    || left.name.localeCompare(right.name),
  );
}

function actionFor(item: BriefItem, reason: string) {
  return { itemId: item.id, label: item.name, reason };
}

function openActionReason(item: BriefItem, beforeEvent?: BriefItem, timezone = "UTC") {
  const priority = item.priority && item.priority !== "normal" ? `, ${item.priority} priority` : "";
  if (beforeEvent?.scheduledAt) {
    return `Open${priority} — do before ${beforeEvent.name} at ${formatTime(beforeEvent.scheduledAt, timezone)}`;
  }
  return `Open${priority} and unscheduled`;
}

export function buildBriefSummary(
  items: BriefItem[],
  today: string,
  now = new Date().toISOString(),
  timezone = "UTC",
) {
  const active = items.filter((item) => item.status === "open" || item.status === "in_progress");
  const inProgress = sortItems(active.filter((item) => item.status === "in_progress"));
  const scheduledToday = sortItems(active.filter((item) => dateKey(item.scheduledAt, timezone) === today));
  const dueToday = sortItems(active.filter((item) => dateKey(item.dueAt, timezone) === today));
  const overdue = sortItems(active.filter((item) => item.dueAt !== undefined && item.dueAt < now && dateKey(item.dueAt, timezone) !== today));
  const upcoming = sortItems(active.filter((item) =>
    (dateKey(item.scheduledAt, timezone) ?? "") > today
    || (dateKey(item.dueAt, timezone) ?? "") > today,
  ));
  const used = new Set([
    ...inProgress.map((item) => item.id),
    ...scheduledToday.map((item) => item.id),
    ...dueToday.map((item) => item.id),
    ...overdue.map((item) => item.id),
    ...upcoming.map((item) => item.id),
  ]);
  const open = sortOpenItems(active.filter((item) => !used.has(item.id)));
  const nextScheduledToday = scheduledToday.find((item) => item.scheduledAt && item.scheduledAt > now);
  const preEventOpen = nextScheduledToday
    ? open.filter((item) => item.priority === "urgent" || item.priority === "high")
    : [];
  const remainingOpen = open.filter((item) => !preEventOpen.some((candidate) => candidate.id === item.id));
  const nextActions: Array<{ itemId: string; label: string; reason: string }> = [];
  const addActions = (candidates: BriefItem[], reason: string) => {
    for (const item of candidates) {
      if (!nextActions.some((action) => action.itemId === item.id)) {
        nextActions.push(actionFor(item, reason));
      }
    }
  };

  addActions(inProgress, "Already in progress");
  addActions(overdue, "Overdue");
  addActions(dueToday, "Due today");
  for (const item of preEventOpen) {
    addActions([item], openActionReason(item, nextScheduledToday, timezone));
  }
  addActions(scheduledToday, nextScheduledToday ? "Next scheduled today" : "Scheduled today");
  for (const item of remainingOpen) addActions([item], openActionReason(item));
  addActions(upcoming, "Upcoming");
  nextActions.splice(5);
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
        const now = new Date().toISOString();
        const today = dateKey(now, args.timezone) as string;
        const details = buildBriefSummary(briefItems, today, now, args.timezone);
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
