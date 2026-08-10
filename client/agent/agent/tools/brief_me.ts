import { defineTool } from "eve/tools";
import { z } from "zod";

import { listItems } from "../lib/system-client.js";

export default defineTool({
  description: "Create a concise items-only daily brief from the authenticated user’s current Briefs work. Do not claim calendar or email context was included.",
  inputSchema: z.object({
    kind: z.enum(["morning", "on_demand"]).default("on_demand"),
  }),
  async execute({ kind }) {
    const items = (await listItems()).filter((item) => item.lifecycle !== "archived");
    const open = items.filter((item) => item.status === "open");
    const inProgress = items.filter((item) => item.status === "in_progress");
    const prioritized = [...open, ...inProgress].sort((left, right) => {
      const priority = { urgent: 0, high: 1, medium: 2, low: 3 } as Record<string, number>;
      return (priority[left.priority ?? "medium"] ?? 2) - (priority[right.priority ?? "medium"] ?? 2);
    });

    return {
      kind,
      source: "briefs-items-only",
      note: "Calendar and email context were not included.",
      counts: { total: items.length, open: open.length, inProgress: inProgress.length },
      items: prioritized.map((item) => ({ id: item.id, name: item.name, status: item.status, priority: item.priority, dueAt: item.dueAt, kind: item.kind })),
    };
  },
});
