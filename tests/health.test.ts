import { describe, expect, it } from "vitest";

import { loadConfig } from "../src/config.js";
import { bootstrap, createApp } from "../src/index.js";

describe("health endpoint", () => {
  it("returns ok", async () => {
    const config = await bootstrap();
    const app = createApp(config);
    const server = app.listen(0);
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected server to bind to a TCP port");
    }

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/health`);
      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload).toMatchObject({
        status: "ok",
        service: "holmplanet-brief",
        storage: {
          graph: loadConfig().databaseUrl ? "postgres" : "memory",
        },
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
