import { getConnectorRegistry } from "../connectors/runtime.js";
import { briefGenerator, BriefKind } from "../briefs/generator.js";
import { briefStore } from "../briefs/store.js";
import { getGraphStore } from "../graph/runtime.js";
import { reasoningEngine } from "../reasoning/engine.js";
import type { ConnectorSyncReport } from "../connectors/types.js";
import type { Brief } from "../briefs/generator.js";

export async function syncConnectors(userId: string): Promise<ConnectorSyncReport[]> {
  return getConnectorRegistry().syncAll(userId);
}

export async function generateBrief(
  userId: string,
  kind: BriefKind,
  options: { syncFirst?: boolean } = {},
): Promise<Brief> {
  if (options.syncFirst ?? true) {
    await syncConnectors(userId);
  }

  const snapshot = await getGraphStore().getSnapshot(userId);
  const changes = reasoningEngine.analyze(snapshot);
  const brief = briefGenerator.generate(userId, kind, changes);
  briefStore.save(brief);
  return brief;
}

export async function generateDeltaBrief(
  userId: string,
  since?: string,
): Promise<{
  since: string;
  checkedAt: string;
  brief: Brief;
  previousBriefAt?: string;
}> {
  const previous = briefStore.get(userId);
  const brief = await generateBrief(userId, BriefKind.DELTA, { syncFirst: true });

  return {
    since: since ?? previous?.generatedAt ?? "last_brief",
    checkedAt: new Date().toISOString(),
    brief,
    previousBriefAt: previous?.generatedAt,
  };
}
