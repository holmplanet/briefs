import { randomUUID } from "node:crypto";

import { issueAccessToken, verifyAccessToken } from "@briefs/shared/auth";
import { Router } from "express";

import type { BriefsConfig } from "../config.js";

type AuthorizationCode = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  userId: string;
  email: string;
  expiresAt: number;
};

const codes = new Map<string, AuthorizationCode>();

function formPage(params: Record<string, string>): string {
  const fields = Object.entries(params)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${value.replaceAll('"', "&quot;")}">`)
    .join("");
  return `<!doctype html><title>Sign in to Briefs</title><style>body{font:16px system-ui;max-width:420px;margin:15vh auto;padding:24px}input{width:100%;box-sizing:border-box;padding:10px;margin:8px 0 16px}button{padding:10px 16px}</style><h1>Sign in to Briefs</h1><p>Local development issuer. Email OTP delivery can be connected before production deployment.</p><form method="post">${fields}<label>Email<input name="email" type="email" value="demo@example.com" required></label><button>Continue</button></form>`;
}

function isAllowedRedirect(uri: string): boolean {
  const configured = (process.env.BRIEFS_OAUTH_REDIRECT_URIS ?? "http://localhost:3000/auth/callback")
    .split(",")
    .map((value) => value.trim());
  return configured.includes(uri);
}

export function createOAuthRouter(config: BriefsConfig): Router {
  const router = Router();
  const issuer = config.oauthIssuer;

  router.get("/.well-known/oauth-authorization-server", (_req, res) => {
    res.json({
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      userinfo_endpoint: `${issuer}/oidc/me`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: ["openid", "email", "profile", "offline_access"],
    });
  });

  router.get("/authorize", (req, res) => {
    const values = Object.fromEntries(
      ["response_type", "client_id", "redirect_uri", "scope", "state", "code_challenge", "code_challenge_method"]
        .map((key) => [key, String(req.query[key] ?? "")]),
    );
    if (values.response_type !== "code" || !values.client_id || !isAllowedRedirect(values.redirect_uri) || !values.code_challenge || values.code_challenge_method !== "S256") {
      res.status(400).send("Invalid OAuth authorization request");
      return;
    }
    res.type("html").send(formPage(values));
  });

  router.post("/authorize", (req, res) => {
    const { client_id: clientId, redirect_uri: redirectUri, state, code_challenge: codeChallenge, email } = req.body as Record<string, string>;
    if (!clientId || !isAllowedRedirect(redirectUri) || !codeChallenge || !email) {
      res.status(400).send("Invalid OAuth authorization request");
      return;
    }
    const code = randomUUID();
    codes.set(code, {
      clientId,
      redirectUri,
      codeChallenge,
      userId: email.toLowerCase(),
      email: email.toLowerCase(),
      expiresAt: Date.now() + 5 * 60_000,
    });
    const callback = new URL(redirectUri);
    callback.searchParams.set("code", code);
    if (state) callback.searchParams.set("state", state);
    res.redirect(callback.toString());
  });

  router.post("/token", async (req, res) => {
    const { grant_type: grantType, code, client_id: clientId, redirect_uri: redirectUri, code_verifier: verifier } = req.body as Record<string, string>;
    const authorization = code ? codes.get(code) : undefined;
    if (grantType !== "authorization_code" || !authorization || authorization.expiresAt < Date.now() || authorization.clientId !== clientId || authorization.redirectUri !== redirectUri || !verifier) {
      res.status(400).json({ error: "invalid_grant" });
      return;
    }
    codes.delete(code);
    const challenge = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const encoded = btoa(String.fromCharCode(...new Uint8Array(challenge))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    if (encoded !== authorization.codeChallenge) {
      res.status(400).json({ error: "invalid_grant" });
      return;
    }
    const accessToken = await issueAccessToken({ sub: authorization.userId, email: authorization.email, iss: issuer }, config.authSecret);
    res.json({ access_token: accessToken, token_type: "Bearer", expires_in: 3600, scope: "openid email profile" });
  });

  router.get("/oidc/me", async (req, res) => {
    const token = (req.header("authorization") ?? "").replace(/^Bearer\s+/, "");
    const claims = await verifyAccessToken(token, config.authSecret, issuer);
    if (!claims) {
      res.status(401).json({ error: "invalid_token" });
      return;
    }
    res.json({ sub: claims.sub, email: claims.email });
  });

  return router;
}
