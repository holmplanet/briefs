import type { GraphEdge, GraphNode, GraphSnapshot } from "./models.js";
import type { GraphStore } from "./store.interface.js";

export class InMemoryGraphStore implements GraphStore {
  private readonly nodes = new Map<string, GraphNode[]>();
  private readonly edges = new Map<string, GraphEdge[]>();

  async getSnapshot(userId: string): Promise<GraphSnapshot> {
    return {
      userId,
      nodes: [...(this.nodes.get(userId) ?? [])],
      edges: [...(this.edges.get(userId) ?? [])],
      syncedAt: new Date().toISOString(),
    };
  }

  async upsertNode(node: GraphNode): Promise<GraphNode> {
    const existing = this.nodes.get(node.userId) ?? [];
    this.nodes.set(
      node.userId,
      [...existing.filter((item) => item.id !== node.id), node],
    );
    return node;
  }

  async upsertEdge(edge: GraphEdge): Promise<GraphEdge> {
    const existing = this.edges.get(edge.userId) ?? [];
    this.edges.set(
      edge.userId,
      [...existing.filter((item) => item.id !== edge.id), edge],
    );
    return edge;
  }

  async close(): Promise<void> {
    this.nodes.clear();
    this.edges.clear();
  }
}
