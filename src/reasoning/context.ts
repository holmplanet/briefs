import { connectorStatusStore } from "../connectors/status.js";
import type { GraphSnapshot } from "../graph/models.js";
import type { ReasoningContext } from "./rules/types.js";

export type BuildReasoningContextOptions = {
  now?: Date;
  since?: string;
};

export function getLastSyncAt(userId: string): string | undefined {
  const timestamps = connectorStatusStore
    .listForUser(userId)
    .map((status) => status.lastSuccessAt)
    .filter((value): value is string => Boolean(value));

  if (timestamps.length === 0) {
    return undefined;
  }

  return timestamps.sort().at(-1);
}

export function buildReasoningContext(
  snapshot: GraphSnapshot,
  options: BuildReasoningContextOptions = {},
): ReasoningContext {
  return {
    snapshot,
    now: options.now ?? new Date(),
    since: options.since,
    lastSyncAt: getLastSyncAt(snapshot.userId),
  };
}
