export const NodeKind = {
  EVENT: "event",
  PERSON: "person",
  TASK: "task",
  WEATHER: "weather",
  CONTEXT: "context",
} as const;

export type NodeKind = (typeof NodeKind)[keyof typeof NodeKind];

export const EdgeKind = {
  DEPENDS_ON: "depends_on",
  WAITING_ON: "waiting_on",
  BLOCKED_BY: "blocked_by",
  RELATED_TO: "related_to",
} as const;

export type EdgeKind = (typeof EdgeKind)[keyof typeof EdgeKind];

export type GraphNode = {
  id: string;
  userId: string;
  kind: NodeKind;
  label: string;
  data: Record<string, unknown>;
  startsAt?: string;
  endsAt?: string;
  updatedAt: string;
};

export type GraphEdge = {
  id: string;
  userId: string;
  kind: EdgeKind;
  sourceId: string;
  targetId: string;
  data: Record<string, unknown>;
  updatedAt: string;
};

export type GraphSnapshot = {
  userId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  syncedAt: string;
};
