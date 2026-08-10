import { createServer, type IncomingMessage } from "node:http";

import { afterEach, describe, expect, it } from "vitest";

import { createItem, listItems } from "../agent/lib/system-client.js";

let server: ReturnType<typeof createServer> | undefined;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve) => server?.close(() => resolve()));
  server = undefined;
});

describe("Eve System client", () => {
  it("propagates the configured identity and bearer token", async () => {
    const requests: IncomingMessage[] = [];
    server = createServer(async (request, response) => {
      requests.push(request);
      let body = "";
      for await (const chunk of request) body += chunk;
      response.setHeader("Content-Type", "application/json");
      response.end(request.method === "POST" ? JSON.stringify({ item: JSON.parse(body) }) : JSON.stringify({ items: [] }));
    });
    await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected server address");

    process.env.BRIEFS_SYSTEM_URL = `http://127.0.0.1:${address.port}`;
    process.env.BRIEFS_EVE_USER_ID = "eve-test-user";
    process.env.BRIEFS_EVE_ACCESS_TOKEN = "eve-test-token";

    await listItems();
    await createItem({ name: "Capture Eve test" });

    expect(requests).toHaveLength(2);
    expect(requests[0].headers.authorization).toBe("Bearer eve-test-token");
    expect(requests[0].headers["x-briefs-user-id"]).toBe("eve-test-user");
    expect(requests[1].method).toBe("POST");
  });
});
