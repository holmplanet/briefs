import { describe, expect, it } from "vitest";

import { bootstrap, createApp } from "../../src/index.js";

describe("actor API", () => {
  it("returns the person actor for the authenticated user", async () => {
    const context = await bootstrap();
    const app = createApp(context);
    const server = app.listen(0);
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected server to bind to a TCP port");
    }

    const base = `http://127.0.0.1:${address.port}`;
    const headers = {
      "X-Briefs-User-Id": "actor-user",
    };

    try {
      const response = await fetch(`${base}/api/v1/actors/me`, { headers });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.actor).toMatchObject({
        schemaVersion: 1,
        type: "Person",
        identity: "actor-user",
        name: "actor-user",
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
