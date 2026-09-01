import { describe, expect, it } from "vitest";
import express, { type Request } from "express";
import { Pool } from "pg";
import { createMcpProtectedRequestHandler } from "@better-auth/mcp";

import { createBetterAuthCompatibilityHandler, rewriteBetterAuthCompatibilityPath } from "../../src/auth/better-auth-express.js";
import { createBetterAuthResourceMiddleware } from "../../src/auth/better-auth-middleware.js";
import { verifyBetterAuthAccessToken } from "../../src/auth/better-auth-resource.js";
import { createBetterAuthSpike } from "../../src/auth/better-auth-spike.js";

describe("Better Auth Briefs compatibility paths", () => {
  it("rewrites only the legacy OAuth endpoint paths", () => {
    expect(rewriteBetterAuthCompatibilityPath("/oauth/authorize?state=state")).toBe("/oauth/oauth2/authorize?state=state");
    expect(rewriteBetterAuthCompatibilityPath("/oauth/.well-known/oauth-authorization-server")).toBe("/oauth/.well-known/oauth-authorization-server");
    expect(rewriteBetterAuthCompatibilityPath("/health")).toBe("/health");
  });

  it("serves legacy discovery through Express", async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://briefs:briefs@127.0.0.1:5432/briefs" });
    const auth = createBetterAuthSpike(pool, {
      issuer: "http://localhost:8001/oauth",
      secret: "spike-auth-secret-0123456789-abcdef",
      allowedEmails: ["owner@example.com"],
      mcpResource: "http://localhost:3334/mcp",
      apiResource: "http://localhost:8001/api",
      sendOtp: async () => undefined,
    });
    const context = await auth.$context;
    await context.runMigrations();

    const app = express();
    app.use(createBetterAuthCompatibilityHandler(auth));
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected server to bind");

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/oauth/.well-known/oauth-authorization-server`);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        issuer: "http://localhost:8001/oauth",
        authorization_endpoint: "http://localhost:8001/oauth/oauth2/authorize",
      });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      await pool.end();
    }
  });
});

describe("Better Auth validation spike", () => {
  it("validates discovery, registration, OTP, consent, PKCE, and UserInfo", async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://briefs:briefs@127.0.0.1:5432/briefs" });
    let deliveredOtp = "";
    const auth = createBetterAuthSpike(pool, {
      issuer: "http://localhost:8001/oauth",
      secret: "spike-auth-secret-0123456789-abcdef",
      allowedEmails: ["owner@example.com"],
      mcpResource: "http://localhost:3334/mcp",
      apiResource: "http://localhost:8001/api",
      sendOtp: async (_email, otp) => {
        deliveredOtp = otp;
      },
    });

    try {
      const context = await auth.$context;
      await context.runMigrations();

      const candidates = [
        "/oauth/.well-known/oauth-authorization-server",
        "/oauth/oauth2/.well-known/oauth-authorization-server",
        "/.well-known/oauth-authorization-server",
        "/oauth2/.well-known/oauth-authorization-server",
      ];
      let response: Response | undefined;
      let discoveredPath: string | undefined;
      for (const path of candidates) {
        const candidate = await auth.handler(new Request(`http://localhost:8001${path}`));
        if (candidate.status === 200) {
          response = candidate;
          discoveredPath = path;
          break;
        }
      }

      expect(response).toBeDefined();
      expect(discoveredPath).toBe("/oauth/.well-known/oauth-authorization-server");
      const metadata = await response!.json();
      expect(metadata).toMatchObject({
        issuer: "http://localhost:8001/oauth",
        authorization_endpoint: "http://localhost:8001/oauth/oauth2/authorize",
        token_endpoint: "http://localhost:8001/oauth/oauth2/token",
        registration_endpoint: "http://localhost:8001/oauth/oauth2/register",
        code_challenge_methods_supported: ["S256"],
      });

      const registration = await auth.handler(
        new Request("http://localhost:8001/oauth/oauth2/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            client_name: "Briefs spike client",
            redirect_uris: ["http://localhost:3000/auth/callback"],
            token_endpoint_auth_method: "none",
            application_type: "native",
          }),
        }),
      );

      const registrationBody = await registration.text();
      expect(registration.status).toBe(201);
      const client = JSON.parse(registrationBody) as { client_id: string };
      expect(client).toMatchObject({
        client_name: "Briefs spike client",
        token_endpoint_auth_method: "none",
      });

      const otpRequest = await auth.handler(
        new Request("http://localhost:8001/oauth/email-otp/send-verification-otp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "owner@example.com", type: "sign-in" }),
        }),
      );
      expect(otpRequest.status).toBe(200);
      expect(deliveredOtp).toMatch(/^\d{6}$/);

      const signIn = await auth.handler(
        new Request("http://localhost:8001/oauth/sign-in/email-otp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "owner@example.com", otp: deliveredOtp }),
        }),
      );
      expect(signIn.status).toBe(200);
      const sessionCookie = signIn.headers.get("set-cookie")?.split(";", 1)[0];
      expect(sessionCookie).toMatch(/^better-auth\.session_token=/);

      const authorizeParams = new URLSearchParams({
        response_type: "code",
        client_id: client.client_id,
        redirect_uri: "http://localhost:3000/auth/callback",
        scope: "openid email profile offline_access",
        state: "spike-state",
        code_challenge: Buffer.from(
          await crypto.subtle.digest("SHA-256", new TextEncoder().encode("spike-verifier")),
        ).toString("base64url"),
        code_challenge_method: "S256",
      });
      authorizeParams.append("resource", "http://localhost:3334/mcp");
      authorizeParams.append("resource", "http://localhost:8001/api");
      const authorization = await auth.handler(
        new Request(`http://localhost:8001/oauth/oauth2/authorize?${authorizeParams}`, {
          headers: { cookie: sessionCookie! },
        }),
      );

      expect(authorization.status).toBe(302);
      const consentLocation = new URL(authorization.headers.get("location")!, "http://localhost:8001");
      let callbackLocation: URL;
      if (consentLocation.pathname === "/consent") {
        const consent = await auth.handler(
          new Request("http://localhost:8001/oauth/oauth2/consent", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              cookie: sessionCookie!,
            },
            body: JSON.stringify({ accept: true, oauth_query: consentLocation.search.slice(1) }),
          }),
        );
        expect(consent.status).toBe(200);
        const consentResult = await consent.json() as { url?: string; redirect_uri?: string };
        callbackLocation = new URL(consentResult.url ?? consentResult.redirect_uri!);
      } else {
        callbackLocation = consentLocation;
      }
      expect(callbackLocation.origin).toBe("http://localhost:3000");
      expect(callbackLocation.searchParams.get("state")).toBe("spike-state");

      const token = await auth.handler(
        new Request("http://localhost:8001/oauth/oauth2/token", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: (() => {
            const params = new URLSearchParams({
            grant_type: "authorization_code",
            code: callbackLocation.searchParams.get("code")!,
            client_id: client.client_id,
            redirect_uri: "http://localhost:3000/auth/callback",
            code_verifier: "spike-verifier",
            });
            params.append("resource", "http://localhost:3334/mcp");
            params.append("resource", "http://localhost:8001/api");
            return params;
          })(),
        }),
      );
      const tokenResponseBody = await token.text();
      expect(token.status).toBe(200);
      const tokenBody = JSON.parse(tokenResponseBody) as { access_token: string; refresh_token: string };
      expect(tokenBody).toMatchObject({
        token_type: "Bearer",
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });
      const tokenClaims = JSON.parse(Buffer.from(tokenBody.access_token.split(".")[1], "base64url").toString()) as { aud?: string };
      expect(tokenClaims.aud).toEqual(expect.arrayContaining([
        "http://localhost:3334/mcp",
        "http://localhost:8001/api",
        "http://localhost:8001/oauth/oauth2/userinfo",
      ]));

      const userInfo = await auth.handler(
        new Request("http://localhost:8001/oauth/oauth2/userinfo", {
          headers: { authorization: `Bearer ${tokenBody.access_token}` },
        }),
      );
      expect(userInfo.status).toBe(200);
      const profile = await userInfo.json() as { sub: string; email: string };
      expect(profile.email).toBe("owner@example.com");
      expect(profile.sub).not.toBe("owner@example.com");

      const issuerApp = express();
      issuerApp.use(createBetterAuthCompatibilityHandler(auth));
      const issuerServer = issuerApp.listen(0);
      const issuerAddress = issuerServer.address();
      if (!issuerAddress || typeof issuerAddress === "string") throw new Error("Expected issuer server to bind");

      try {
        const requireMcpAuth = createMcpProtectedRequestHandler(
          {
            issuer: "http://localhost:8001/oauth",
            audience: "http://localhost:3334/mcp",
            jwksUrl: `http://127.0.0.1:${issuerAddress.port}/oauth/jwks`,
          },
          async (_request, claims) => new Response(JSON.stringify({ sub: claims.sub }), {
            headers: { "content-type": "application/json" },
          }),
        );
        const mcpResponse = await requireMcpAuth(
          new Request("http://localhost:3334/mcp", {
            headers: { authorization: `Bearer ${tokenBody.access_token}` },
          }),
        );

        expect(mcpResponse.status).toBe(200);
        await expect(mcpResponse.json()).resolves.toMatchObject({ sub: profile.sub });

        const requireApiAuth = createMcpProtectedRequestHandler(
          {
            issuer: "http://localhost:8001/oauth",
            audience: "http://localhost:8001/api",
            jwksUrl: `http://127.0.0.1:${issuerAddress.port}/oauth/jwks`,
          },
          async (_request, claims) => new Response(JSON.stringify({ sub: claims.sub }), {
            headers: { "content-type": "application/json" },
          }),
        );
        const apiResponse = await requireApiAuth(
          new Request("http://localhost:8001/api/v1/items", {
            headers: { authorization: `Bearer ${tokenBody.access_token}` },
          }),
        );
        expect(apiResponse.status).toBe(200);
        await expect(apiResponse.json()).resolves.toMatchObject({ sub: profile.sub });

        const resourceApp = express();
        resourceApp.get(
          "/api/v1/items",
          createBetterAuthResourceMiddleware({
            issuer: "http://localhost:8001/oauth",
            audience: "http://localhost:8001/api",
            jwksUrl: `http://127.0.0.1:${issuerAddress.port}/oauth/jwks`,
          }),
          (request, response) => response.json({ userId: (request as Request & { userId: string }).userId }),
        );
        const resourceServer = resourceApp.listen(0);
        const resourceAddress = resourceServer.address();
        if (!resourceAddress || typeof resourceAddress === "string") throw new Error("Expected resource server to bind");

        try {
          const resourceResponse = await fetch(`http://127.0.0.1:${resourceAddress.port}/api/v1/items`, {
            headers: { authorization: `Bearer ${tokenBody.access_token}` },
          });
          expect(resourceResponse.status).toBe(200);
          await expect(resourceResponse.json()).resolves.toMatchObject({ userId: profile.sub });

          const unauthorizedResponse = await fetch(`http://127.0.0.1:${resourceAddress.port}/api/v1/items`);
          expect(unauthorizedResponse.status).toBe(401);
        } finally {
          await new Promise<void>((resolve, reject) => resourceServer.close((error) => (error ? reject(error) : resolve())));
        }

        await expect(verifyBetterAuthAccessToken(tokenBody.access_token, {
          issuer: "http://localhost:8001/oauth",
          audience: "http://localhost:8001/api",
          jwksUrl: `http://127.0.0.1:${issuerAddress.port}/oauth/jwks`,
        })).resolves.toMatchObject({ sub: profile.sub });

        await expect(verifyBetterAuthAccessToken(tokenBody.access_token, {
          issuer: "http://localhost:8001/oauth",
          audience: "http://localhost:3334/other-resource",
          jwksUrl: `http://127.0.0.1:${issuerAddress.port}/oauth/jwks`,
        })).resolves.toBeNull();

        await expect(verifyBetterAuthAccessToken(`${tokenBody.access_token}tampered`, {
          issuer: "http://localhost:8001/oauth",
          audience: "http://localhost:8001/api",
          jwksUrl: `http://127.0.0.1:${issuerAddress.port}/oauth/jwks`,
        })).resolves.toBeNull();
      } finally {
        await new Promise<void>((resolve, reject) => issuerServer.close((error) => (error ? reject(error) : resolve())));
      }
    } finally {
      await pool.end();
    }
  });
});
