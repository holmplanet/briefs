import { getConnectorRegistry } from "../connectors/runtime.js";
import { briefGenerator, BriefKind, type Brief } from "../briefs/generator.js";
import { briefStore } from "../briefs/store.js";
import { getGraphStore } from "../graph/runtime.js";
import type { ConnectorSyncReport } from "../connectors/types.js";
import { buildReasoningContext } from "../reasoning/context.js";
import { diffInsights } from "../reasoning/diff.js";
import { InsightKind, reasoningEngine, type ChangeSet } from "../reasoning/engine.js";

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
  briefStore.save(brief, changes);
  return brief;
}

function noDeltaInsight(userId: string): ChangeSet {
  const generatedAt = new Date().toISOString();
  return {
    userId,
    generatedAt,
    insights: [
      {
        id: "no-delta-changes",
        kind: InsightKind.MISSING_INFO,
        message: "No new changes since your last brief.",
        priority: 3,
        relatedNodeIds: [],
      },
    ],
  };
}

export async function generateDeltaBrief(
  userId: string,
  since?: string,
): Promise<{
  since: string;
  checkedAt: string;
  brief: Brief;
  previousBriefAt?: string;
  changeSet: ChangeSet;
}> {
  const previousBrief = briefStore.get(userId);
  const previousChangeSet = briefStore.getChangeSet(userId);
  const sinceTimestamp = since ?? previousBrief?.generatedAt;

  await syncConnectors(userId);

  const snapshot = await getGraphStore().getSnapshot(userId);
  const context = buildReasoningContext(snapshot, { since: sinceTimestamp });
  const currentChangeSet = reasoningEngine.analyzeContext(context);

  let insights = currentChangeSet.insights;
  if (previousChangeSet) {
    insights = diffInsights(previousChangeSet.insights, currentChangeSet.insights);
  }

  const changes: ChangeSet =
    insights.length > 0
      ? { ...currentChangeSet, insights }
      : noDeltaInsight(userId);

  const brief = briefGenerator.generate(userId, BriefKind.DELTA, changes);
  briefStore.save(brief, currentChangeSet);

  return {
    since: sinceTimestamp ?? "last_brief",
    checkedAt: new Date().toISOString(),
    brief,
    previousBriefAt: previousBrief?.generatedAt,
    changeSet: changes,
  };
}
