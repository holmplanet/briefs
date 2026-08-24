import { afterEach, describe, expect, it } from "vitest";

import { bootstrap, createApp } from "../src/index.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("health", () => {
  it("returns ok", async () => {
    const context = await bootstrap();
    const app = createApp(context);
    const server = app.listen(0);
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected server to bind to a TCP port");
    }

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/health`);
      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload).toMatchObject({ status: "ok", service: "holmplanet-briefs" });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});

describe("production configuration", () => {
  it("requires an explicit email allowlist", async () => {
    process.env.APP_ENV = "production";
    delete process.env.AUTH_ALLOWED_EMAILS;

    await expect(import("../src/config.js").then(({ loadConfig }) => loadConfig())).rejects.toThrow(
      "AUTH_ALLOWED_EMAILS",
    );
  });

  it("treats Vercel production as production without APP_ENV", async () => {
    delete process.env.APP_ENV;
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.AUTH_ALLOWED_EMAILS = "carter@example.com";

    const { loadConfig } = await import("../src/config.js");
    const config = loadConfig();

    expect(config.env).toBe("production");
    expect(config.authDevBypass).toBe(false);
  });
});
