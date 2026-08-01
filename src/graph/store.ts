import type { GraphEdge, GraphNode, GraphSnapshot } from "./models.js";

export class InMemoryGraphStore {
  private readonly nodes = new Map<string, GraphNode[]>();
  private readonly edges = new Map<string, GraphEdge[]>();

  getSnapshot(userId: string): GraphSnapshot {
    return {
      userId,
      nodes: [...(this.nodes.get(userId) ?? [])],
      edges: [...(this.edges.get(userId) ?? [])],
      syncedAt: new Date().toISOString(),
    };
  }

  upsertNode(node: GraphNode): GraphNode {
    const existing = this.nodes.get(node.userId) ?? [];
    this.nodes.set(
      node.userId,
      [...existing.filter((item) => item.id !== node.id), node],
    );
    return node;
  }

  upsertEdge(edge: GraphEdge): GraphEdge {
    const existing = this.edges.get(edge.userId) ?? [];
    this.edges.set(
      edge.userId,
      [...existing.filter((item) => item.id !== edge.id), edge],
    );
    return edge;
  }
}

export const graphStore = new InMemoryGraphStore();
