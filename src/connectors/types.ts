import { createHash } from "node:crypto";

import type { EdgeKind, GraphEdge, GraphNode, NodeKind } from "../graph/models.js";

export const ConnectorPack = {
  PERSONAL: "personal",
  FISHING: "fishing",
  LIVESTOCK: "livestock",
} as const;

export type ConnectorPack = (typeof ConnectorPack)[keyof typeof ConnectorPack];

export type ConnectorDefinition = {
  name: string;
  pack: ConnectorPack;
  description: string;
  readOnly?: boolean;
};

export type NormalizedNodeInput = {
  externalId: string;
  kind: NodeKind;
  label: string;
  data?: Record<string, unknown>;
  startsAt?: string;
  endsAt?: string;
};

export type NormalizedEdgeInput = {
  externalId: string;
  kind: EdgeKind;
  sourceExternalId: string;
  targetExternalId: string;
  data?: Record<string, unknown>;
};

export type NormalizedSyncPayload = {
  nodes: NormalizedNodeInput[];
  edges: NormalizedEdgeInput[];
};

export type ConnectorSyncResult = {
  connector: string;
  userId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  syncedAt: string;
};

export type ConnectorHealth = {
  ok: boolean;
  name: string;
  detail?: string;
};

export type ConnectorSyncError = {
  message: string;
  code?: string;
  cause?: string;
};

export type ConnectorSyncStatus = {
  connector: string;
  userId: string;
  lastSyncAt?: string;
  lastSuccessAt?: string;
  lastError?: ConnectorSyncError;
  nodesWritten: number;
  edgesWritten: number;
};

export type ConnectorSyncReport = {
  connector: string;
  userId: string;
  ok: boolean;
  syncedAt: string;
  nodesWritten: number;
  edgesWritten: number;
  error?: ConnectorSyncError;
};

export interface Connector {
  readonly definition: ConnectorDefinition;
  health(userId: string): Promise<ConnectorHealth>;
  fetch(userId: string): Promise<NormalizedSyncPayload>;
  sync(userId: string): Promise<ConnectorSyncResult>;
}

function stableUuid(namespace: string, value: string): string {
  const hash = createHash("sha256").update(`${namespace}:${value}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `a${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

export function mapPayloadToGraph(
  userId: string,
  connectorName: string,
  payload: NormalizedSyncPayload,
  options: {
    resolveExternalNodeId?: (externalId: string) => string | undefined;
  } = {},
): ConnectorSyncResult {
  const namespace = `${userId}:${connectorName}`;
  const syncedAt = new Date().toISOString();
  const externalToInternal = new Map<string, string>();

  const nodes: GraphNode[] = payload.nodes.map((node) => {
    const id = stableUuid(namespace, `node:${node.externalId}`);
    externalToInternal.set(node.externalId, id);
    return {
      id,
      userId,
      kind: node.kind,
      label: node.label,
      data: {
        ...node.data,
        connector: connectorName,
        externalId: node.externalId,
      },
      startsAt: node.startsAt,
      endsAt: node.endsAt,
      updatedAt: syncedAt,
    };
  });

  const resolveNodeId = (externalId: string): string | undefined =>
    externalToInternal.get(externalId) ?? options.resolveExternalNodeId?.(externalId);

  const edges: GraphEdge[] = [];
  for (const edge of payload.edges) {
    const sourceId = resolveNodeId(edge.sourceExternalId);
    const targetId = resolveNodeId(edge.targetExternalId);
    if (!sourceId || !targetId) {
      throw new Error(
        `Connector ${connectorName} referenced unknown edge endpoints: ${edge.sourceExternalId} -> ${edge.targetExternalId}`,
      );
    }

    edges.push({
      id: stableUuid(namespace, `edge:${edge.externalId}`),
      userId,
      kind: edge.kind,
      sourceId,
      targetId,
      data: {
        ...edge.data,
        connector: connectorName,
        externalId: edge.externalId,
      },
      updatedAt: syncedAt,
    });
  }

  return {
    connector: connectorName,
    userId,
    nodes,
    edges,
    syncedAt,
  };
}
