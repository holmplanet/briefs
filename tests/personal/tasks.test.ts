import { describe, expect, it } from "vitest";

import { bootstrap, createApp } from "../../src/index.js";

describe("personal tasks API", () => {
  it("creates, lists, and updates a task", async () => {
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
      "X-Brief-User-Id": "test-user",
    };

    try {
      const createResponse = await fetch(`${base}/api/v1/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify({ label: "Ship schema overhaul" }),
      });
      expect(createResponse.status).toBe(201);
      const created = await createResponse.json();
      expect(created.task).toMatchObject({
        schemaVersion: 1,
        label: "Ship schema overhaul",
        status: "open",
        userId: "test-user",
      });

      const listResponse = await fetch(`${base}/api/v1/tasks`, { headers });
      expect(listResponse.status).toBe(200);
      const listed = await listResponse.json();
      expect(listed.tasks).toHaveLength(1);

      const patchResponse = await fetch(`${base}/api/v1/tasks/${created.task.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "done" }),
      });
      expect(patchResponse.status).toBe(200);
      const updated = await patchResponse.json();
      expect(updated.task.status).toBe("done");
      expect(updated.task.completedAt).toBeTruthy();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
