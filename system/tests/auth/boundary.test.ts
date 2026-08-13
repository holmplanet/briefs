import { describe, expect, it } from "vitest";

import { issueAccessToken } from "@briefs/shared/auth";

import { bootstrap, createApp } from "../../src/index.js";

describe("API auth boundary", () => {
  it("rejects user-id header impersonation when the development bypass is disabled", async () => {
    const context = await bootstrap();
    const app = createApp(context);
    const server = app.listen(0);
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected server to bind to a TCP port");
    }

    const previousBypass = process.env.BRIEFS_API_DEV_BYPASS;
    process.env.BRIEFS_API_DEV_BYPASS = "false";

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/items`, {
        headers: { "X-Briefs-User-Id": "impersonated-user" },
      });

      expect(response.status).toBe(401);
    } finally {
      if (previousBypass === undefined) delete process.env.BRIEFS_API_DEV_BYPASS;
      else process.env.BRIEFS_API_DEV_BYPASS = previousBypass;
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("uses the bearer subject as the authenticated user", async () => {
    const context = await bootstrap();
    const app = createApp(context);
    const server = app.listen(0);
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected server to bind to a TCP port");
    }

    const secret = process.env.BRIEFS_AUTH_SECRET ?? "dev-briefs-auth-secret";
    const issuer = `http://localhost:${process.env.BRIEFS_PORT ?? "8001"}/oauth`;
    const token = await issueAccessToken(
      { sub: "token-user", email: "token@example.com", iss: issuer },
      secret,
    );

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/actors/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Briefs-User-Id": "ignored-header-user",
        },
      });

      expect(response.status).toBe(200);
      expect((await response.json()).actor).toMatchObject({ identity: "token-user" });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
