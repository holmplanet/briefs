import { describe, expect, it } from "vitest";

import { issueAccessToken } from "@briefs/shared/auth";
import type { AppContext } from "../src/bootstrap";
import { handleWebOAuthRequest } from "../src/web-oauth";

function createContext(): AppContext {
  return {
    config: {
      env: "production",
      host: "127.0.0.1",
      port: 8001,
      databaseUrl: "postgres://example",
      authSecret: "preview-auth-secret",
      oauthIssuer: "https://preview.example.com/oauth",
      authDevBypass: false,
      oauthClientId: "briefs-daily",
      oauthRedirectUris: ["https://preview.example.com/auth/callback"],
      oauthAllowedRedirectUris: ["https://claude.ai/api/mcp/auth_callback"],
      oauthAllowedEmails: ["owner@example.com"],
      otpMailer: "resend",
      resendApiKey: "re_example",
      emailFrom: "Briefs <preview@example.com>",
      otpTtlSeconds: 600,
    },
  } as AppContext;
}

describe("Vercel OAuth adapter", () => {
  it("serves OAuth discovery metadata from the hosted issuer", async () => {
    const response = await handleWebOAuthRequest(
      new Request("https://preview.example.com/oauth/.well-known/oauth-authorization-server"),
      createContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      issuer: "https://preview.example.com/oauth",
      authorization_endpoint: "https://preview.example.com/oauth/authorize",
      token_endpoint: "https://preview.example.com/oauth/token",
      code_challenge_methods_supported: ["S256"],
    });
  });

  it("rejects authorization requests for an unregistered redirect URI", async () => {
    const response = await handleWebOAuthRequest(
      new Request("https://preview.example.com/oauth/authorize?response_type=code&client_id=briefs-daily&redirect_uri=https%3A%2F%2Fevil.example%2Fcallback&code_challenge=challenge&code_challenge_method=S256"),
      createContext(),
    );

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Invalid OAuth authorization request");
  });

  it("rejects OTP requests for emails outside the allowlist", async () => {
    const body = new URLSearchParams({
      response_type: "code",
      client_id: "briefs-daily",
      redirect_uri: "https://preview.example.com/auth/callback",
      code_challenge: "challenge",
      code_challenge_method: "S256",
      consent: "on",
      email: "other@example.com",
    });
    const response = await handleWebOAuthRequest(
      new Request("https://preview.example.com/oauth/authorize/request", {
        method: "POST",
        body,
      }),
      createContext(),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toContain("text/html");
    await expect(response.text()).resolves.toContain("not authorized for this Briefs account");
  });

  it("returns an inline error for malformed email addresses", async () => {
    const body = new URLSearchParams({
      response_type: "code",
      client_id: "briefs-daily",
      redirect_uri: "https://preview.example.com/auth/callback",
      code_challenge: "challenge",
      code_challenge_method: "S256",
      consent: "on",
      email: "not-an-email",
    });
    const response = await handleWebOAuthRequest(
      new Request("https://preview.example.com/oauth/authorize/request", {
        method: "POST",
        body,
      }),
      createContext(),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("text/html");
    await expect(response.text()).resolves.toContain("Enter a valid email address");
  });

  it("refreshes hosted OAuth access tokens without accepting refresh tokens as API tokens", async () => {
    const refreshToken = await issueAccessToken(
      { sub: "owner@example.com", email: "owner@example.com", iss: "https://preview.example.com/oauth", tokenUse: "refresh" },
      "preview-auth-secret",
      3600,
    );
    const response = await handleWebOAuthRequest(
      new Request("https://preview.example.com/oauth/token", {
        method: "POST",
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: "briefs-daily" }),
      }),
      createContext(),
    );

    expect(response.status).toBe(200);
    const tokens = await response.json();
    expect(tokens.access_token).toEqual(expect.any(String));
    expect(tokens.refresh_token).toBe(refreshToken);

    const profile = await handleWebOAuthRequest(
      new Request("https://preview.example.com/oauth/oidc/me", { headers: { Authorization: `Bearer ${refreshToken}` } }),
      createContext(),
    );
    expect(profile.status).toBe(401);
  });
});
