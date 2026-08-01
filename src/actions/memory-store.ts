import type { ActionAuditEntry, ActionProposal, ActionStore } from "./types.js";

export class InMemoryActionStore implements ActionStore {
  private readonly proposals = new Map<string, ActionProposal>();
  private readonly auditEntries: ActionAuditEntry[] = [];

  async save(proposal: ActionProposal): Promise<ActionProposal> {
    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  async get(actionId: string): Promise<ActionProposal | undefined> {
    return this.proposals.get(actionId);
  }

  async listForUser(userId: string, status?: ActionProposal["status"]): Promise<ActionProposal[]> {
    return [...this.proposals.values()]
      .filter((proposal) => proposal.userId === userId)
      .filter((proposal) => (status ? proposal.status === status : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async update(proposal: ActionProposal): Promise<ActionProposal> {
    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  async appendAudit(entry: ActionAuditEntry): Promise<ActionAuditEntry> {
    this.auditEntries.push(entry);
    return entry;
  }

  async listAuditForAction(actionId: string): Promise<ActionAuditEntry[]> {
    return this.auditEntries
      .filter((entry) => entry.actionId === actionId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async listAuditForUser(userId: string): Promise<ActionAuditEntry[]> {
    return this.auditEntries
      .filter((entry) => entry.userId === userId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  clear(): void {
    this.proposals.clear();
    this.auditEntries.length = 0;
  }
}
