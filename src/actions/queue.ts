export const ActionStatus = {
  PROPOSED: "proposed",
  APPROVED: "approved",
  EXECUTED: "executed",
  REJECTED: "rejected",
} as const;

export type ActionStatus = (typeof ActionStatus)[keyof typeof ActionStatus];

export type ActionProposal = {
  id: string;
  userId: string;
  actionType: string;
  summary: string;
  payload: Record<string, unknown>;
  status: ActionStatus;
  createdAt: string;
};

export class ActionQueue {
  private readonly proposals = new Map<string, ActionProposal>();

  propose(proposal: ActionProposal): ActionProposal {
    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  get(actionId: string): ActionProposal | undefined {
    return this.proposals.get(actionId);
  }
}

export const actionQueue = new ActionQueue();
