import { getActionEngine } from "../actions/runtime.js";
import type {
  ActionAuditEntry,
  ActionProposal,
  ApproveActionResult,
  ProposeActionInput,
} from "../actions/types.js";
import { ActionStatus } from "../actions/types.js";

export async function proposeAction(input: ProposeActionInput): Promise<ActionProposal> {
  return getActionEngine().propose(input);
}

export async function approveAction(
  userId: string,
  actionId: string,
): Promise<ApproveActionResult> {
  return getActionEngine().approve(userId, actionId);
}

export async function getAction(actionId: string): Promise<ActionProposal | undefined> {
  return getActionEngine().get(actionId);
}

export async function listActions(
  userId: string,
  status?: ActionProposal["status"],
): Promise<ActionProposal[]> {
  return getActionEngine().listForUser(userId, status);
}

export async function listActionAudit(actionId: string): Promise<ActionAuditEntry[]> {
  return getActionEngine().listAuditForAction(actionId);
}

export { ActionStatus };
