import { describe, expect, it } from "vitest";

import { bootstrap, createApp } from "../../src/index.js";

describe("brief API", () => {
  it("creates, lists, and scopes a persisted brief", async () => {
    const context = await bootstrap();
    const app = createApp(context);
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected server to bind");

    try {
      const base = `http://127.0.0.1:${address.port}`;
      const headers = { "Content-Type": "application/json", "X-Briefs-User-Id": "brief-user" };
      const createdResponse = await fetch(`${base}/api/v1/briefs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          kind: "morning",
          headline: "Your morning Brief",
          summary: "Review the open work.",
          itemIds: [],
        }),
      });
      expect(createdResponse.status).toBe(201);
      const created = await createdResponse.json();
      expect(created.brief).toMatchObject({
        schemaVersion: 1,
        userId: "brief-user",
        kind: "morning",
        headline: "Your morning Brief",
      });

      const listResponse = await fetch(`${base}/api/v1/briefs`, { headers });
      expect(listResponse.status).toBe(200);
      expect((await listResponse.json()).briefs).toHaveLength(1);

      const otherUserResponse = await fetch(`${base}/api/v1/briefs`, {
        headers: { "X-Briefs-User-Id": "other-user" },
      });
      expect((await otherUserResponse.json()).briefs).toHaveLength(0);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });
});
