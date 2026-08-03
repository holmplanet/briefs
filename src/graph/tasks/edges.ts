import { EdgeKind } from "../models.js";
import type { NormalizedEdgeInput } from "../../connectors/types.js";

export type TaskEdgeInput = {
  externalId: string;
  kind: typeof EdgeKind.BLOCKED_BY | typeof EdgeKind.WAITING_ON | typeof EdgeKind.DEPENDS_ON;
  sourceExternalId: string;
  targetExternalId: string;
  reason?: string;
};

/**
 * Edge semantics (source → target):
 * - blocked_by: source task cannot proceed until target is resolved
 * - waiting_on: source is waiting for target (person, task, or event)
 * - depends_on: source requires target to be satisfied first
 */
export function buildTaskEdge(input: TaskEdgeInput): NormalizedEdgeInput {
  return {
    externalId: input.externalId,
    kind: input.kind,
    sourceExternalId: input.sourceExternalId,
    targetExternalId: input.targetExternalId,
    data: input.reason ? { reason: input.reason } : {},
  };
}
