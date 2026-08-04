import { describe, expect, it } from "vitest";

import { bootstrap, createApp } from "../../src/index.js";

describe("item API", () => {
  it("creates, lists, and updates an item", async () => {
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
      const createResponse = await fetch(`${base}/api/v1/items`, {
        method: "POST",
        headers,
        body: JSON.stringify({ label: "Ship schema overhaul" }),
      });
      expect(createResponse.status).toBe(201);
      const created = await createResponse.json();
      expect(created.item).toMatchObject({
        schemaVersion: 2,
        label: "Ship schema overhaul",
        status: "open",
        userId: "test-user",
        context: "core",
        archiveStatus: "active",
      });

      const activitiesResponse = await fetch(
        `${base}/api/v1/items/${created.item.id}/activities`,
        { headers },
      );
      expect(activitiesResponse.status).toBe(200);
      const activitiesBody = await activitiesResponse.json();
      expect(activitiesBody.activities).toHaveLength(1);
      expect(activitiesBody.activities[0]).toMatchObject({
        type: "Create",
        objectId: created.item.id,
      });

      const listResponse = await fetch(`${base}/api/v1/items`, { headers });
      expect(listResponse.status).toBe(200);
      const listed = await listResponse.json();
      expect(listed.items).toHaveLength(1);

      const patchResponse = await fetch(`${base}/api/v1/items/${created.item.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "done" }),
      });
      expect(patchResponse.status).toBe(200);
      const updated = await patchResponse.json();
      expect(updated.item.status).toBe("done");
      expect(updated.item.completedAt).toBeTruthy();

      const activitiesAfterUpdate = await fetch(
        `${base}/api/v1/items/${created.item.id}/activities`,
        { headers },
      );
      const updatedActivities = await activitiesAfterUpdate.json();
      expect(updatedActivities.activities).toHaveLength(2);
      expect(updatedActivities.activities[1].type).toBe("Update");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
