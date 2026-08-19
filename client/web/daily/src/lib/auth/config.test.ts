import { afterEach, describe, expect, it } from "vitest";

import { loadAuthConfig } from "./config";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("Daily auth configuration", () => {
  it("does not enable the development bypass in production", () => {
    process.env.NODE_ENV = "production";
    process.env.BRIEFS_OAUTH_ISSUER = "https://briefs.example.com/oauth";
    process.env.BRIEFS_SESSION_SECRET = "production-session-secret";
    process.env.BRIEFS_AUTH_DEV_BYPASS = "true";

    expect(loadAuthConfig().devBypass).toBe(false);
  });

  it("fails fast when production OAuth is not configured", () => {
    process.env.NODE_ENV = "production";
    delete process.env.BRIEFS_OAUTH_ISSUER;
    process.env.BRIEFS_SESSION_SECRET = "production-session-secret";

    expect(() => loadAuthConfig()).toThrow("BRIEFS_OAUTH_ISSUER");
  });

  it("keeps the dev user bypass available outside production", () => {
    delete process.env.NODE_ENV;
    delete process.env.BRIEFS_OAUTH_ISSUER;
    delete process.env.BRIEFS_AUTH_DEV_BYPASS;

    expect(loadAuthConfig().devBypass).toBe(true);
  });
});
