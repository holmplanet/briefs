import type { Pool } from "pg";

import type {
  ActionAuditEntry,
  ActionProposal,
  ActionStatus,
  ActionStore,
} from "./types.js";

type ProposalRow = {
  id: string;
  user_id: string;
  action_type: string;
  summary: string;
  payload: Record<string, unknown>;
  status: ActionStatus;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: Date;
  approved_at: Date | null;
  executed_at: Date | null;
  rejected_at: Date | null;
};

type AuditRow = {
  id: string;
  action_id: string;
  user_id: string;
  event: ActionAuditEntry["event"];
  detail: Record<string, unknown>;
  created_at: Date;
};

function mapProposal(row: ProposalRow): ActionProposal {
  return {
    id: row.id,
    userId: row.user_id,
    actionType: row.action_type,
    summary: row.summary,
    payload: row.payload ?? {},
    status: row.status,
    createdAt: row.created_at.toISOString(),
    approvedAt: row.approved_at?.toISOString(),
    executedAt: row.executed_at?.toISOString(),
    rejectedAt: row.rejected_at?.toISOString(),
    result: row.result ? (row.result as ActionProposal["result"]) : undefined,
    error: row.error ?? undefined,
  };
}

function mapAudit(row: AuditRow): ActionAuditEntry {
  return {
    id: row.id,
    actionId: row.action_id,
    userId: row.user_id,
    event: row.event,
    detail: row.detail ?? {},
    createdAt: row.created_at.toISOString(),
  };
}

export class PostgresActionStore implements ActionStore {
  constructor(private readonly pool: Pool) {}

  async save(proposal: ActionProposal): Promise<ActionProposal> {
    await this.pool.query(
      `INSERT INTO action_proposals (
         id, user_id, action_type, summary, payload, status, result, error,
         created_at, approved_at, executed_at, rejected_at
       ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         result = EXCLUDED.result,
         error = EXCLUDED.error,
         approved_at = EXCLUDED.approved_at,
         executed_at = EXCLUDED.executed_at,
         rejected_at = EXCLUDED.rejected_at`,
      [
        proposal.id,
        proposal.userId,
        proposal.actionType,
        proposal.summary,
        JSON.stringify(proposal.payload),
        proposal.status,
        proposal.result ? JSON.stringify(proposal.result) : null,
        proposal.error ?? null,
        proposal.createdAt,
        proposal.approvedAt ?? null,
        proposal.executedAt ?? null,
        proposal.rejectedAt ?? null,
      ],
    );
    return proposal;
  }

  async get(actionId: string): Promise<ActionProposal | undefined> {
    const result = await this.pool.query<ProposalRow>(
      `SELECT id, user_id, action_type, summary, payload, status, result, error,
              created_at, approved_at, executed_at, rejected_at
       FROM action_proposals
       WHERE id = $1`,
      [actionId],
    );
    const row = result.rows[0];
    return row ? mapProposal(row) : undefined;
  }

  async listForUser(userId: string, status?: ActionStatus): Promise<ActionProposal[]> {
    const result = await this.pool.query<ProposalRow>(
      status
        ? `SELECT id, user_id, action_type, summary, payload, status, result, error,
                  created_at, approved_at, executed_at, rejected_at
           FROM action_proposals
           WHERE user_id = $1 AND status = $2
           ORDER BY created_at DESC`
        : `SELECT id, user_id, action_type, summary, payload, status, result, error,
                  created_at, approved_at, executed_at, rejected_at
           FROM action_proposals
           WHERE user_id = $1
           ORDER BY created_at DESC`,
      status ? [userId, status] : [userId],
    );
    return result.rows.map(mapProposal);
  }

  async update(proposal: ActionProposal): Promise<ActionProposal> {
    return this.save(proposal);
  }

  async appendAudit(entry: ActionAuditEntry): Promise<ActionAuditEntry> {
    await this.pool.query(
      `INSERT INTO action_audit_log (id, action_id, user_id, event, detail, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
      [
        entry.id,
        entry.actionId,
        entry.userId,
        entry.event,
        JSON.stringify(entry.detail),
        entry.createdAt,
      ],
    );
    return entry;
  }

  async listAuditForAction(actionId: string): Promise<ActionAuditEntry[]> {
    const result = await this.pool.query<AuditRow>(
      `SELECT id, action_id, user_id, event, detail, created_at
       FROM action_audit_log
       WHERE action_id = $1
       ORDER BY created_at ASC`,
      [actionId],
    );
    return result.rows.map(mapAudit);
  }

  async listAuditForUser(userId: string): Promise<ActionAuditEntry[]> {
    const result = await this.pool.query<AuditRow>(
      `SELECT id, action_id, user_id, event, detail, created_at
       FROM action_audit_log
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId],
    );
    return result.rows.map(mapAudit);
  }

  clear(): void {
    throw new Error("PostgresActionStore does not support clear()");
  }
}
