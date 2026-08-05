import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { bootstrap, createApp } from "../../../system/src/index.js";

import { BriefsClient } from "../src/client.js";
import { loadConfig } from "../src/config.js";
import { runSmoke } from "../src/commands/smoke.js";

describe("briefs smoke", () => {
  let baseUrl = "";
  let server: ReturnType<ReturnType<typeof createApp>["listen"]>;

  beforeAll(async () => {
    const context = await bootstrap();
    const app = createApp(context);
    server = app.listen(0);
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected server to bind to a TCP port");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  it("passes against an in-process API", async () => {
    const config = loadConfig({
      apiUrl: baseUrl,
      userId: "cli-smoke-test",
      json: true,
      quiet: true,
    });
    const client = new BriefsClient(config);
    const result = await runSmoke(client, config, { keep: true });

    expect(result.ok).toBe(true);
    expect(result.steps.map((step) => step.name)).toEqual([
      "health",
      "actors_me",
      "create_item",
      "get_item",
      "list_activities",
      "list_items",
    ]);
  });
});
