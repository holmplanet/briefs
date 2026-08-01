import type { GraphEdge, GraphNode } from "../graph/models.js";

export type ConnectorSyncResult = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type ConnectorHealth = {
  ok: boolean;
  name: string;
  detail?: string;
};

export interface Connector {
  readonly name: string;
  health(): Promise<ConnectorHealth>;
  sync(userId: string): Promise<ConnectorSyncResult>;
}
