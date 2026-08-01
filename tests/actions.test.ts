import { describe, expect, it } from "vitest";

import { createActionEngine } from "../src/actions/engine.js";
import { InMemoryActionStore } from "../src/actions/memory-store.js";
import {
  ActionAuditEvent,
  ActionStatus,
  ActionType,
} from "../src/actions/types.js";
import { approveAction, listActionAudit, proposeAction } from "../src/mcp/action-service.js";
import { getActionEngine, setActionEngine, setActionStore } from "../src/actions/runtime.js";

function createTestEngine() {
  const store = new InMemoryActionStore();
  const engine = createActionEngine(store);
  setActionStore(store);
  setActionEngine(engine);
  return { store, engine };
}

describe("action engine", () => {
  it("proposes actions without executing them", async () => {
    createTestEngine();

    const proposal = await proposeAction({
      userId: "user-1",
      actionType: ActionType.DRAFT_REPLY,
      summary: "Reply to John about the charter",
      payload: {
        to: "john@example.com",
        subject: "Saturday charter",
        body: "Hi John, Saturday still works for us.",
      },
    });

    expect(proposal.status).toBe(ActionStatus.PROPOSED);
    expect(proposal.executedAt).toBeUndefined();

    const audit = await listActionAudit(proposal.id);
    expect(audit.map((entry) => entry.event)).toEqual([ActionAuditEvent.PROPOSED]);
  });

  it("requires explicit approval before execution", async () => {
    createTestEngine();

    const proposal = await proposeAction({
      userId: "user-1",
      actionType: ActionType.DRAFT_RESCHEDULE,
      summary: "Move outdoor standup",
      payload: {
        eventLabel: "Outdoor standup",
        newStart: "2026-08-02T15:00:00.000Z",
        newEnd: "2026-08-02T15:30:00.000Z",
      },
    });

    const stored = await getActionEngine().get(proposal.id);
    expect(stored?.status).toBe(ActionStatus.PROPOSED);
    expect(stored?.result).toBeUndefined();
  });

  it("executes approved actions in draft-only mode", async () => {
    createTestEngine();

    const proposal = await proposeAction({
      userId: "user-1",
      actionType: ActionType.DRAFT_NOTIFY,
      summary: "Notify team about weather risk",
      payload: {
        recipient: "field-team",
        message: "Thunderstorms expected during the afternoon standup.",
        channel: "sms",
      },
    });

    const result = await approveAction("user-1", proposal.id);
    expect(result.status).toBe("executed");
    if (result.status !== "executed") {
      throw new Error("Expected executed result");
    }

    expect(result.result.mode).toBe("draft");
    expect(result.result.message).toContain("Nothing was delivered");
    expect(result.proposal.status).toBe(ActionStatus.EXECUTED);
    expect(result.audit.map((entry) => entry.event)).toEqual([
      ActionAuditEvent.PROPOSED,
      ActionAuditEvent.APPROVED,
      ActionAuditEvent.EXECUTED,
    ]);
  });

  it("rejects approval for the wrong user or duplicate approval", async () => {
    createTestEngine();

    const proposal = await proposeAction({
      userId: "user-1",
      actionType: ActionType.LOG_NOTE,
      summary: "Capture follow-up",
      payload: { note: "Call vendor Monday" },
    });

    const wrongUser = await approveAction("user-2", proposal.id);
    expect(wrongUser).toEqual({
      status: "error",
      actionId: proposal.id,
      message: "Action does not belong to user",
    });

    const approved = await approveAction("user-1", proposal.id);
    expect(approved.status).toBe("executed");

    const again = await approveAction("user-1", proposal.id);
    expect(again.status).toBe("error");
    if (again.status === "error") {
      expect(again.message).toContain("already executed");
    }
  });

  it("uses a draft fallback executor for unknown action types", async () => {
    createTestEngine();

    const proposal = await proposeAction({
      userId: "user-1",
      actionType: "custom_vertical_action",
      summary: "Prepare bait inventory check",
      payload: { inventory: ["shrimp", "squid"] },
    });

    const result = await approveAction("user-1", proposal.id);
    expect(result.status).toBe("executed");
    if (result.status === "executed") {
      expect(result.result.mode).toBe("draft");
      expect(result.result.message).toContain("No external write occurred");
    }
  });
});
