export const ActionStatus = {
  PROPOSED: "proposed",
  APPROVED: "approved",
  EXECUTED: "executed",
  REJECTED: "rejected",
  FAILED: "failed",
} as const;

export type ActionStatus = (typeof ActionStatus)[keyof typeof ActionStatus];

export const ActionAuditEvent = {
  PROPOSED: "proposed",
  APPROVED: "approved",
  EXECUTED: "executed",
  REJECTED: "rejected",
  FAILED: "failed",
} as const;

export type ActionAuditEvent = (typeof ActionAuditEvent)[keyof typeof ActionAuditEvent];

export const ActionType = {
  DRAFT_REPLY: "draft_reply",
  DRAFT_RESCHEDULE: "draft_reschedule",
  DRAFT_NOTIFY: "draft_notify",
  LOG_NOTE: "log_note",
} as const;

export type ActionType = (typeof ActionType)[keyof typeof ActionType];

export type ActionProposal = {
  id: string;
  userId: string;
  actionType: string;
  summary: string;
  payload: Record<string, unknown>;
  status: ActionStatus;
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
  rejectedAt?: string;
  result?: ActionExecutionResult;
  error?: string;
};

export type ActionExecutionResult = {
  mode: "draft";
  actionType: string;
  summary: string;
  message: string;
  draft: Record<string, unknown>;
};

export type ActionAuditEntry = {
  id: string;
  actionId: string;
  userId: string;
  event: ActionAuditEvent;
  detail: Record<string, unknown>;
  createdAt: string;
};

export type ProposeActionInput = {
  userId: string;
  actionType: string;
  summary: string;
  payload?: Record<string, unknown>;
};

export type ApproveActionResult =
  | {
      status: "executed";
      actionId: string;
      proposal: ActionProposal;
      result: ActionExecutionResult;
      audit: ActionAuditEntry[];
    }
  | {
      status: "error";
      actionId?: string;
      message: string;
    };

export interface ActionStore {
  save(proposal: ActionProposal): Promise<ActionProposal>;
  get(actionId: string): Promise<ActionProposal | undefined>;
  listForUser(userId: string, status?: ActionStatus): Promise<ActionProposal[]>;
  update(proposal: ActionProposal): Promise<ActionProposal>;
  appendAudit(entry: ActionAuditEntry): Promise<ActionAuditEntry>;
  listAuditForAction(actionId: string): Promise<ActionAuditEntry[]>;
  listAuditForUser(userId: string): Promise<ActionAuditEntry[]>;
  clear(): void;
}
