import type { Pool } from "pg";

import type { EdgeKind, GraphEdge, GraphNode, GraphSnapshot, NodeKind } from "./models.js";
import type { GraphStore } from "./store.interface.js";

type NodeRow = {
  id: string;
  user_id: string;
  kind: string;
  label: string;
  data: Record<string, unknown>;
  starts_at: Date | null;
  ends_at: Date | null;
  updated_at: Date;
};

type EdgeRow = {
  id: string;
  user_id: string;
  kind: string;
  source_id: string;
  target_id: string;
  data: Record<string, unknown>;
  updated_at: Date;
};

export function rowToNode(row: NodeRow): GraphNode {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind as NodeKind,
    label: row.label,
    data: row.data ?? {},
    startsAt: row.starts_at?.toISOString(),
    endsAt: row.ends_at?.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function rowToEdge(row: EdgeRow): GraphEdge {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind as EdgeKind,
    sourceId: row.source_id,
    targetId: row.target_id,
    data: row.data ?? {},
    updatedAt: row.updated_at.toISOString(),
  };
}

export class PostgresGraphStore implements GraphStore {
  constructor(private readonly pool: Pool) {}

  async getSnapshot(userId: string): Promise<GraphSnapshot> {
    const [nodeResult, edgeResult] = await Promise.all([
      this.pool.query<NodeRow>(
        `SELECT id, user_id, kind, label, data, starts_at, ends_at, updated_at
         FROM graph_nodes
         WHERE user_id = $1
         ORDER BY updated_at DESC`,
        [userId],
      ),
      this.pool.query<EdgeRow>(
        `SELECT id, user_id, kind, source_id, target_id, data, updated_at
         FROM graph_edges
         WHERE user_id = $1
         ORDER BY updated_at DESC`,
        [userId],
      ),
    ]);

    return {
      userId,
      nodes: nodeResult.rows.map(rowToNode),
      edges: edgeResult.rows.map(rowToEdge),
      syncedAt: new Date().toISOString(),
    };
  }

  async upsertNode(node: GraphNode): Promise<GraphNode> {
    const result = await this.pool.query<NodeRow>(
      `INSERT INTO graph_nodes (
         id, user_id, kind, label, data, starts_at, ends_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         kind = EXCLUDED.kind,
         label = EXCLUDED.label,
         data = EXCLUDED.data,
         starts_at = EXCLUDED.starts_at,
         ends_at = EXCLUDED.ends_at,
         updated_at = EXCLUDED.updated_at
       WHERE graph_nodes.user_id = EXCLUDED.user_id
       RETURNING id, user_id, kind, label, data, starts_at, ends_at, updated_at`,
      [
        node.id,
        node.userId,
        node.kind,
        node.label,
        JSON.stringify(node.data),
        node.startsAt ?? null,
        node.endsAt ?? null,
        node.updatedAt,
      ],
    );

    if (result.rowCount === 0) {
      throw new Error(`Node ${node.id} belongs to a different user`);
    }

    return rowToNode(result.rows[0]!);
  }

  async upsertEdge(edge: GraphEdge): Promise<GraphEdge> {
    const endpointCheck = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM graph_nodes
       WHERE user_id = $1 AND id IN ($2, $3)`,
      [edge.userId, edge.sourceId, edge.targetId],
    );

    if (endpointCheck.rows[0]?.count !== "2") {
      throw new Error("Edge endpoints must exist for the same user");
    }

    const result = await this.pool.query<EdgeRow>(
      `INSERT INTO graph_edges (
         id, user_id, kind, source_id, target_id, data, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       ON CONFLICT ON CONSTRAINT graph_edges_user_endpoints_unique DO UPDATE SET
         data = EXCLUDED.data,
         updated_at = EXCLUDED.updated_at
       WHERE graph_edges.user_id = EXCLUDED.user_id
       RETURNING id, user_id, kind, source_id, target_id, data, updated_at`,
      [
        edge.id,
        edge.userId,
        edge.kind,
        edge.sourceId,
        edge.targetId,
        JSON.stringify(edge.data),
        edge.updatedAt,
      ],
    );

    if (result.rowCount === 0) {
      throw new Error(`Edge ${edge.id} belongs to a different user`);
    }

    return rowToEdge(result.rows[0]!);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
