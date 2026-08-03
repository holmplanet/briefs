import { mapPayloadToGraph } from "../connectors/types.js";
import type { NormalizedEdgeInput, NormalizedNodeInput } from "../connectors/types.js";
import type { GraphSnapshot } from "../graph/models.js";
import { getGraphStore } from "../graph/runtime.js";

export type IngestContextInput = {
  userId: string;
  source: string;
  nodes: NormalizedNodeInput[];
  edges: NormalizedEdgeInput[];
};

export type IngestContextReport = {
  userId: string;
  source: string;
  syncedAt: string;
  nodesWritten: number;
  edgesWritten: number;
};

function resolveExistingNodeId(snapshot: GraphSnapshot, externalId: string): string | undefined {
  return snapshot.nodes.find((node) => String(node.data.externalId ?? "") === externalId)?.id;
}

export async function ingestContext(input: IngestContextInput): Promise<IngestContextReport> {
  const store = getGraphStore();
  const snapshot = await store.getSnapshot(input.userId);
  const result = mapPayloadToGraph(input.userId, input.source, {
    nodes: input.nodes,
    edges: input.edges,
  }, {
    resolveExternalNodeId: (externalId) => resolveExistingNodeId(snapshot, externalId),
  });

  for (const node of result.nodes) {
    await store.upsertNode(node);
  }
  for (const edge of result.edges) {
    await store.upsertEdge(edge);
  }

  return {
    userId: input.userId,
    source: input.source,
    syncedAt: result.syncedAt,
    nodesWritten: result.nodes.length,
    edgesWritten: result.edges.length,
  };
}
