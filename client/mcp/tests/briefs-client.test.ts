import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { bootstrap, createApp } from "../../../system/src/index.js";
import { createBriefsApiClient } from "../src/briefs-client.js";

describe("BriefsApiClient", () => {
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

  it("creates and lists items for a user", async () => {
    const client = createBriefsApiClient("mcp-test-user", baseUrl);
    const item = await client.createItem({ name: "MCP tool test", kind: "task" });
    const items = await client.listItems();

    expect(items.some((entry) => entry.id === item.id)).toBe(true);
  });
});
