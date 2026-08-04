import { describe, expect, it } from "vitest";

import { bootstrap, createApp } from "../../src/index.js";

describe("brief API", () => {
  it("generates, lists, and fetches a brief from stitches", async () => {
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
      "X-Briefs-User-Id": "brief-user",
    };

    try {
      const stitchResponse = await fetch(`${base}/api/v1/stitches`, {
        method: "POST",
        headers,
        body: JSON.stringify({ label: "Review PR feedback", priority: "high" }),
      });
      expect(stitchResponse.status).toBe(201);

      const generateResponse = await fetch(`${base}/api/v1/brief/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ kind: "morning" }),
      });
      expect(generateResponse.status).toBe(201);
      const generated = await generateResponse.json();
      expect(generated.brief).toMatchObject({
        schemaVersion: 1,
        userId: "brief-user",
        kind: "morning",
        greeting: "Good morning. Here's your brief.",
      });
      expect(generated.brief.bullets.length).toBeGreaterThan(0);
      expect(generated.brief.relatedStitchIds).toHaveLength(1);

      const listResponse = await fetch(`${base}/api/v1/briefs`, { headers });
      expect(listResponse.status).toBe(200);
      const listed = await listResponse.json();
      expect(listed.briefs).toHaveLength(1);

      const getResponse = await fetch(`${base}/api/v1/briefs/${generated.brief.id}`, {
        headers,
      });
      expect(getResponse.status).toBe(200);
      const fetched = await getResponse.json();
      expect(fetched.brief.id).toBe(generated.brief.id);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("generates an empty-state brief when no stitches exist", async () => {
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
      "X-Briefs-User-Id": "empty-brief-user",
    };

    try {
      const generateResponse = await fetch(`${base}/api/v1/brief/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      expect(generateResponse.status).toBe(201);
      const generated = await generateResponse.json();
      expect(generated.brief.headline).toBe("Nothing on the loom");
      expect(generated.brief.relatedStitchIds).toHaveLength(0);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
