import { describe, expect, it } from "vitest";

import { buildBriefSummary } from "../src/tools/brief-me.js";

function item(name: string, options: Record<string, unknown> = {}) {
  return {
    id: `${name.toLowerCase().replaceAll(" ", "-")}-0000-0000-0000-000000000000`,
    name,
    kind: "task",
    status: "open",
    priority: "normal",
    description: undefined,
    dueAt: undefined,
    scheduledAt: undefined,
    ...options,
  } as never;
}

describe("buildBriefSummary", () => {
  it("fills next actions with prioritized open work after time-sensitive items", () => {
    const result = buildBriefSummary([
      item("Laundry", { priority: "normal" }),
      item("Pay rent", { priority: "high" }),
      item("Work", { status: "in_progress" }),
      item("Mail", { priority: "low" }),
    ], "2026-08-31");

    expect(result.nextActions).toEqual([
      { itemId: "work-0000-0000-0000-000000000000", label: "Work", reason: "Already in progress" },
      { itemId: "pay-rent-0000-0000-0000-000000000000", label: "Pay rent", reason: "Open, high priority and unscheduled" },
      { itemId: "laundry-0000-0000-0000-000000000000", label: "Laundry", reason: "Open and unscheduled" },
      { itemId: "mail-0000-0000-0000-000000000000", label: "Mail", reason: "Open, low priority and unscheduled" },
    ]);
  });

  it("does not repeat an item that is both scheduled and due today", () => {
    const result = buildBriefSummary([
      item("Meeting", {
        scheduledAt: "2026-08-31T16:00:00.000Z",
        dueAt: "2026-08-31T17:00:00.000Z",
      }),
    ], "2026-08-31");

    expect(result.nextActions).toHaveLength(1);
    expect(result.nextActions[0]?.reason).toBe("Scheduled today");
  });
});
