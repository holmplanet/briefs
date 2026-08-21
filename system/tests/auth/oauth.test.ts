import { afterEach, describe, expect, it } from "vitest";

import { bootstrap, createApp } from "../../src/index.js";

const originalOtp = process.env.DEV_OTP_CODE;

afterEach(() => {
  if (originalOtp === undefined) delete process.env.DEV_OTP_CODE;
  else process.env.DEV_OTP_CODE = originalOtp;
});

describe("OAuth email OTP flow", () => {
  it("persists a one-time challenge and exchanges a PKCE code", async () => {
    process.env.DEV_OTP_CODE = "123456";
    const context = await bootstrap();
    const app = createApp(context);
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected server to bind");

    try {
      const base = `http://127.0.0.1:${address.port}`;
      const verifier = "test-verifier";
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
      const challenge = Buffer.from(digest).toString("base64url");
      const oauth = {
        response_type: "code",
        client_id: "briefs-daily",
        redirect_uri: "http://localhost:3000/auth/callback",
        scope: "openid email",
        state: "state",
        code_challenge: challenge,
        code_challenge_method: "S256",
      };

      const start = await fetch(`${base}/oauth/authorize?${new URLSearchParams(oauth)}`);
      expect(start.status).toBe(200);

      const request = await fetch(`${base}/oauth/authorize/request`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ ...oauth, email: "auth-test@example.com" }),
      });
      expect(request.status).toBe(200);
      const requestHtml = await request.text();
      const challengeId = requestHtml.match(/name="challenge_id" value="([^"]+)"/)?.[1];
      expect(challengeId).toBeTruthy();

      const verified = await fetch(`${base}/oauth/authorize/verify`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ ...oauth, challenge_id: challengeId!, code: "123456" }),
        redirect: "manual",
      });
      expect(verified.status).toBe(302);
      const code = new URL(verified.headers.get("location")!).searchParams.get("code");
      expect(code).toBeTruthy();

      const token = await fetch(`${base}/oauth/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code: code!, client_id: oauth.client_id, redirect_uri: oauth.redirect_uri, code_verifier: verifier }),
      });
      expect(token.status).toBe(200);
      const tokens = await token.json();
      expect(tokens.refresh_token).toEqual(expect.any(String));
      const profile = await fetch(`${base}/oauth/oidc/me`, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
      expect(profile.status).toBe(200);
      expect(await profile.json()).toMatchObject({ sub: "auth-test@example.com", email: "auth-test@example.com" });

      const refreshed = await fetch(`${base}/oauth/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: tokens.refresh_token, client_id: oauth.client_id }),
      });
      expect(refreshed.status).toBe(200);
      const refreshedTokens = await refreshed.json();
      expect(refreshedTokens.access_token).toEqual(expect.any(String));

      const refreshAsAccess = await fetch(`${base}/oauth/oidc/me`, { headers: { Authorization: `Bearer ${tokens.refresh_token}` } });
      expect(refreshAsAccess.status).toBe(401);

      const replay = await fetch(`${base}/oauth/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code: code!, client_id: oauth.client_id, redirect_uri: oauth.redirect_uri, code_verifier: verifier }),
      });
      expect(replay.status).toBe(400);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });
});
