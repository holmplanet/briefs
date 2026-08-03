import { NodeKind } from "../models.js";
import type { NormalizedNodeInput } from "../../connectors/types.js";
import {
  TASK_PROTOCOL_VERSION,
  TaskStatus,
  type TaskPriority,
  type TaskProtocolV1,
  taskProtocolV1Schema,
} from "./protocol.js";

export type TaskInput = {
  externalId: string;
  label: string;
  status?: TaskStatus;
  dueAt?: string;
  scheduledAt?: string;
  completedAt?: string;
  priority?: TaskPriority;
  description?: string;
  url?: string;
  source?: string;
};

function toProtocol(input: TaskInput): TaskProtocolV1 {
  return taskProtocolV1Schema.parse({
    schemaVersion: TASK_PROTOCOL_VERSION,
    status: input.status ?? TaskStatus.OPEN,
    dueAt: input.dueAt,
    completedAt: input.completedAt,
    priority: input.priority,
  });
}

export function buildTaskNode(input: TaskInput): NormalizedNodeInput {
  const protocol = toProtocol(input);

  return {
    externalId: input.externalId,
    kind: NodeKind.TASK,
    label: input.label.trim() || "Untitled task",
    startsAt: input.scheduledAt,
    endsAt: input.dueAt,
    data: {
      ...protocol,
      ...(input.description ? { description: input.description } : {}),
      ...(input.url ? { url: input.url } : {}),
      ...(input.source ? { source: input.source } : {}),
    },
  };
}
