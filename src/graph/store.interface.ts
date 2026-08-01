import type { GraphEdge, GraphNode, GraphSnapshot } from "./models.js";

export interface GraphStore {
  getSnapshot(userId: string): Promise<GraphSnapshot>;
  upsertNode(node: GraphNode): Promise<GraphNode>;
  upsertEdge(edge: GraphEdge): Promise<GraphEdge>;
  close(): Promise<void>;
}
