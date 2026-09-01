import { describe, expect, it } from "vitest";

import { bootstrap, createApp } from "../../src/index.js";

describe("Better Auth runtime wiring", () => {
  it("boots the flagged provider and authenticates a real API request", async () => {
    const environment = {
      AUTH_PROVIDER: process.env.AUTH_PROVIDER,
      AUTH_ALLOWED_EMAILS: process.env.AUTH_ALLOWED_EMAILS,
      DATABASE_URL: process.env.DATABASE_URL,
      AUTH_SECRET: process.env.AUTH_SECRET,
      OAUTH_ISSUER: process.env.OAUTH_ISSUER,
      API_RESOURCE: process.env.API_RESOURCE,
    };
    const issuer = "http://localhost:18001/oauth";
    const email = `runtime-${Date.now()}@example.com`;

    process.env.AUTH_PROVIDER = "better-auth";
    process.env.AUTH_ALLOWED_EMAILS = email;
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgres://briefs:briefs@127.0.0.1:5432/briefs";
    process.env.AUTH_SECRET = "spike-auth-secret-0123456789-abcdef";
    process.env.OAUTH_ISSUER = issuer;
    process.env.API_RESOURCE = "http://localhost:18001/api";

    const context = await bootstrap();
    expect(context.betterAuth).toBeDefined();
    const app = createApp(context);
    const server = app.listen(18001);
    const baseUrl = "http://127.0.0.1:18001";
    let otp = "";
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      const message = args.join(" ");
      const match = message.match(new RegExp(`^\\[Briefs OAuth\\] OTP for ${email}: (\\d{6})$`));
      if (match) otp = match[1];
      originalLog(...args);
    };

    try {
      const discovery = await fetch(`${baseUrl}/oauth/.well-known/oauth-authorization-server`);
      expect(discovery.status).toBe(200);
      await expect(discovery.json()).resolves.toMatchObject({
        issuer,
        authorization_endpoint: `${issuer}/oauth2/authorize`,
      });

      const registration = await fetch(`${baseUrl}/oauth/oauth2/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_name: "Briefs runtime test",
          redirect_uris: ["http://localhost:3000/auth/callback"],
          token_endpoint_auth_method: "none",
          application_type: "native",
        }),
      });
      expect(registration.status).toBe(201);
      const client = await registration.json() as { client_id: string };

      const unsafeRegistration = await fetch(`${baseUrl}/oauth/oauth2/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_name: "Unexpected redirect client",
          redirect_uris: ["https://attacker.example/callback"],
          token_endpoint_auth_method: "none",
          application_type: "web",
        }),
      });
      expect(unsafeRegistration.status).toBe(400);

      const otpResponse = await fetch(`${baseUrl}/oauth/email-otp/send-verification-otp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, type: "sign-in" }),
      });
      expect(otpResponse.status).toBe(200);
      expect(otp).toMatch(/^\d{6}$/);

      const signIn = await fetch(`${baseUrl}/oauth/sign-in/email-otp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      expect(signIn.status).toBe(200);
      const sessionCookie = signIn.headers.get("set-cookie")?.split(";", 1)[0];
      expect(sessionCookie).toMatch(/^better-auth\.session_token=/);

      const verifier = "runtime-verifier";
      const challenge = Buffer.from(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
      ).toString("base64url");
      const authorizeParams = new URLSearchParams({
        response_type: "code",
        client_id: client.client_id,
        redirect_uri: "http://localhost:3000/auth/callback",
        scope: "openid email profile offline_access",
        state: "runtime-state",
        code_challenge: challenge,
        code_challenge_method: "S256",
      });
      authorizeParams.append("resource", "http://localhost:18001/api");

      const authorization = await fetch(`${baseUrl}/oauth/oauth2/authorize?${authorizeParams}`, {
        headers: { cookie: sessionCookie! },
        redirect: "manual",
      });
      expect([200, 302]).toContain(authorization.status);
      const authorizationBody = authorization.status === 200
        ? await authorization.json() as { url: string }
        : undefined;
      const consentLocation = new URL(
        authorization.headers.get("location") ?? authorizationBody!.url,
        baseUrl,
      );
      const consent = await fetch(`${baseUrl}/oauth/oauth2/consent`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: sessionCookie!,
        },
        body: JSON.stringify({ accept: true, oauth_query: consentLocation.search.slice(1) }),
      });
      expect(consent.status).toBe(200);
      const consentResult = await consent.json() as { url: string };
      const callback = new URL(consentResult.url);

      const token = await fetch(`${baseUrl}/oauth/oauth2/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: callback.searchParams.get("code")!,
          client_id: client.client_id,
          redirect_uri: "http://localhost:3000/auth/callback",
          code_verifier: verifier,
          resource: "http://localhost:18001/api",
        }),
      });
      expect(token.status).toBe(200);
      const tokenBody = await token.json() as { access_token: string };

      const apiResponse = await fetch(`${baseUrl}/api/v1/actors/me`, {
        headers: { authorization: `Bearer ${tokenBody.access_token}` },
      });
      expect(apiResponse.status).toBe(200);
      await expect(apiResponse.json()).resolves.toMatchObject({ actor: { identity: expect.any(String) } });
    } finally {
      console.log = originalLog;
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      for (const [key, value] of Object.entries(environment)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
