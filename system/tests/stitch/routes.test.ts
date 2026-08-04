import { describe, expect, it } from "vitest";

import { bootstrap, createApp } from "../../src/index.js";

describe("stitch API", () => {
  it("creates, lists, and updates a stitch", async () => {
    const context = await bootstrap();
    const app = createApp(context);
    const server = app.listen(0);
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected server to bind to a TCP port");
    }

    const base = `http://127.0.0.1:${address.port}`;
    const headers = {
      "Content-Type": "application/json",
      "X-Briefs-User-Id": "test-user",
    };

    try {
      const createResponse = await fetch(`${base}/api/v1/stitches`, {
        method: "POST",
        headers,
        body: JSON.stringify({ label: "Ship schema overhaul" }),
      });
      expect(createResponse.status).toBe(201);
      const created = await createResponse.json();
      expect(created.stitch).toMatchObject({
        schemaVersion: 1,
        label: "Ship schema overhaul",
        status: "open",
        userId: "test-user",
      });

      const listResponse = await fetch(`${base}/api/v1/stitches`, { headers });
      expect(listResponse.status).toBe(200);
      const listed = await listResponse.json();
      expect(listed.stitches).toHaveLength(1);

      const patchResponse = await fetch(`${base}/api/v1/stitches/${created.stitch.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "done" }),
      });
      expect(patchResponse.status).toBe(200);
      const updated = await patchResponse.json();
      expect(updated.stitch.status).toBe("done");
      expect(updated.stitch.completedAt).toBeTruthy();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
