import type { BriefsClient } from "../client.js";
import type { CliConfig } from "../config.js";
import { printData } from "../output.js";

export type SmokeStep = {
  name: string;
  ok: boolean;
  ms: number;
  detail?: string;
  itemId?: string;
};

export type SmokeResult = {
  ok: boolean;
  steps: SmokeStep[];
  durationMs: number;
};

export async function runSmoke(
  client: BriefsClient,
  config: CliConfig,
  options: { keep?: boolean },
): Promise<SmokeResult> {
  const started = Date.now();
  const steps: SmokeStep[] = [];
  let itemId: string | undefined;

  const runStep = async (name: string, fn: () => Promise<string | undefined>) => {
    const stepStarted = Date.now();
    try {
      const detail = await fn();
      steps.push({ name, ok: true, ms: Date.now() - stepStarted, detail, itemId });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      steps.push({ name, ok: false, ms: Date.now() - stepStarted, detail: message, itemId });
      throw error;
    }
  };

  try {
    await runStep("health", async () => {
      const health = await client.health();
      if (health.status !== "ok") {
        throw new Error(`unexpected health status: ${health.status}`);
      }
      if (health.service !== "holmplanet-briefs") {
        throw new Error(
          `unexpected service: ${health.service} (is something else running on ${config.apiUrl}?)`,
        );
      }
      return health.storage;
    });

    await runStep("actors_me", async () => {
      const actor = await client.getActorMe();
      return actor.id;
    });

    await runStep("create_item", async () => {
      const item = await client.createItem({
        name: `CLI smoke ${new Date().toISOString()}`,
        kind: "task",
      });
      itemId = item.id;
      return item.id;
    });

    await runStep("get_item", async () => {
      if (!itemId) {
        throw new Error("missing item id from create step");
      }
      const item = await client.getItem(itemId);
      return item.name;
    });

    await runStep("list_activities", async () => {
      if (!itemId) {
        throw new Error("missing item id from create step");
      }
      const activities = await client.listItemActivities(itemId);
      if (activities.length < 1) {
        throw new Error("expected at least one activity");
      }
      return String(activities.length);
    });

    await runStep("list_items", async () => {
      if (!itemId) {
        throw new Error("missing item id from create step");
      }
      const items = await client.listItems();
      if (!items.some((item) => item.id === itemId)) {
        throw new Error("created item not found in list");
      }
      return String(items.length);
    });

    if (!options.keep && itemId) {
      await runStep("archive_item", async () => {
        const item = await client.updateItem(itemId!, { lifecycle: "archived" });
        return item.lifecycle;
      });
    }
  } catch {
    // steps already recorded; fall through to result
  }

  const result: SmokeResult = {
    ok: steps.every((step) => step.ok),
    steps,
    durationMs: Date.now() - started,
  };

  if (config.json) {
    printData(config, result);
  } else {
    for (const step of result.steps) {
      const status = step.ok ? "ok" : "FAIL";
      const suffix = step.detail ? ` (${step.detail})` : "";
      console.log(`${status.padEnd(4)} ${step.name}${suffix} [${step.ms}ms]`);
    }
    console.log(result.ok ? "\nSmoke passed." : "\nSmoke failed.");
  }

  return result;
}
