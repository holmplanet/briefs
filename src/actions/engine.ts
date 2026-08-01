import { randomUUID } from "node:crypto";

import { defaultActionExecutorRegistry } from "./executors/registry.js";
import type { ActionExecutorRegistry } from "./executors/types.js";
import {
  ActionAuditEvent,
  ActionStatus,
  type ActionAuditEntry,
  type ActionProposal,
  type ApproveActionResult,
  type ProposeActionInput,
  type ActionStore,
} from "./types.js";

export class ActionEngine {
  constructor(
    private readonly store: ActionStore,
    private readonly executors: ActionExecutorRegistry = defaultActionExecutorRegistry,
  ) {}

  async propose(input: ProposeActionInput): Promise<ActionProposal> {
    const createdAt = new Date().toISOString();
    const proposal: ActionProposal = {
      id: randomUUID(),
      userId: input.userId,
      actionType: input.actionType,
      summary: input.summary,
      payload: input.payload ?? {},
      status: ActionStatus.PROPOSED,
      createdAt,
    };

    await this.store.save(proposal);
    await this.recordAudit(proposal.id, proposal.userId, ActionAuditEvent.PROPOSED, {
      actionType: proposal.actionType,
      summary: proposal.summary,
    });

    return proposal;
  }

  async get(actionId: string): Promise<ActionProposal | undefined> {
    return this.store.get(actionId);
  }

  async listForUser(userId: string, status?: ActionProposal["status"]): Promise<ActionProposal[]> {
    return this.store.listForUser(userId, status);
  }

  async listAuditForAction(actionId: string): Promise<ActionAuditEntry[]> {
    return this.store.listAuditForAction(actionId);
  }

  async approve(userId: string, actionId: string): Promise<ApproveActionResult> {
    const proposal = await this.store.get(actionId);
    if (!proposal) {
      return { status: "error", message: "Action not found" };
    }
    if (proposal.userId !== userId) {
      return { status: "error", actionId, message: "Action does not belong to user" };
    }
    if (proposal.status !== ActionStatus.PROPOSED) {
      return {
        status: "error",
        actionId,
        message: `Action is already ${proposal.status}`,
      };
    }

    const approvedAt = new Date().toISOString();
    const approvedProposal: ActionProposal = {
      ...proposal,
      status: ActionStatus.APPROVED,
      approvedAt,
    };
    await this.store.update(approvedProposal);
    await this.recordAudit(actionId, userId, ActionAuditEvent.APPROVED, {
      actionType: proposal.actionType,
    });

    try {
      const executor = this.executors.get(proposal.actionType);
      const result = await executor.execute(proposal);
      const executedProposal: ActionProposal = {
        ...approvedProposal,
        status: ActionStatus.EXECUTED,
        executedAt: new Date().toISOString(),
        result,
      };
      await this.store.update(executedProposal);
      await this.recordAudit(actionId, userId, ActionAuditEvent.EXECUTED, {
        actionType: proposal.actionType,
        mode: result.mode,
        message: result.message,
      });

      const audit = await this.store.listAuditForAction(actionId);
      return {
        status: "executed",
        actionId,
        proposal: executedProposal,
        result,
        audit,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failedProposal: ActionProposal = {
        ...approvedProposal,
        status: ActionStatus.FAILED,
        error: message,
      };
      await this.store.update(failedProposal);
      await this.recordAudit(actionId, userId, ActionAuditEvent.FAILED, { message });

      return { status: "error", actionId, message };
    }
  }

  private async recordAudit(
    actionId: string,
    userId: string,
    event: ActionAuditEvent,
    detail: Record<string, unknown>,
  ): Promise<ActionAuditEntry> {
    return this.store.appendAudit({
      id: randomUUID(),
      actionId,
      userId,
      event,
      detail,
      createdAt: new Date().toISOString(),
    });
  }
}

export function createActionEngine(
  store: ActionStore,
  executors: ActionExecutorRegistry = defaultActionExecutorRegistry,
): ActionEngine {
  return new ActionEngine(store, executors);
}
