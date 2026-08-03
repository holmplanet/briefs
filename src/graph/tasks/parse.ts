import { NodeKind, type GraphNode } from "../models.js";
import {
  TASK_PROTOCOL_FIELDS,
  TASK_PROTOCOL_VERSION,
  TaskStatus,
  type TaskProtocolV1,
  taskProtocolV1Schema,
} from "./protocol.js";

export type TaskNode = GraphNode & {
  kind: typeof NodeKind.TASK;
  task: TaskProtocolV1;
};

export function isTaskNode(node: GraphNode): node is TaskNode {
  return node.kind === NodeKind.TASK;
}

function pickProtocolFields(data: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {
    schemaVersion: data.schemaVersion ?? TASK_PROTOCOL_VERSION,
    status: data.status ?? TaskStatus.OPEN,
  };

  for (const field of TASK_PROTOCOL_FIELDS) {
    if (field === "schemaVersion" || field === "status") {
      continue;
    }
    if (data[field] !== undefined) {
      picked[field] = data[field];
    }
  }

  return picked;
}

export function parseTaskProtocol(data: Record<string, unknown>): TaskProtocolV1 | null {
  const result = taskProtocolV1Schema.safeParse(pickProtocolFields(data));
  return result.success ? result.data : null;
}

export function asTaskNode(node: GraphNode): TaskNode | null {
  if (!isTaskNode(node)) {
    return null;
  }

  const task = parseTaskProtocol(node.data);
  if (!task) {
    return null;
  }

  return { ...node, task };
}
