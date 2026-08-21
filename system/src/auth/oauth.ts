import { createHash, randomInt, randomUUID } from "node:crypto";

import { issueAccessToken, verifyAccessToken } from "@briefs/shared/auth";
import { Router, type Request } from "express";

import type { BriefsConfig } from "../config.js";
import type { AuthStore } from "./store.js";
import type { OtpMailer } from "./mailer.js";

const MAX_OTP_ATTEMPTS = 5;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function formPage(title: string, body: string): string {
  return `<!doctype html><meta name="viewport" content="width=device-width"><title>${title}</title><style>body{font:16px system-ui;max-width:420px;margin:15vh auto;padding:24px}input{width:100%;box-sizing:border-box;padding:10px;margin:8px 0 16px}button{padding:10px 16px}</style>${body}`;
}

function hiddenFields(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${value.replaceAll('"', "&quot;")}">`)
    .join("");
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isAllowedEmail(config: BriefsConfig, email: string): boolean {
  return config.oauthAllowedEmails.length === 0 || config.oauthAllowedEmails.includes(email);
}

async function isAllowedClient(config: BriefsConfig, auth: AuthStore, clientId: string, redirectUri: string): Promise<boolean> {
  if (clientId === config.oauthClientId) return config.oauthRedirectUris.includes(redirectUri);
  const client = await auth.getOAuthClient(clientId);
  return Boolean(client?.redirectUris.includes(redirectUri));
}

function challengeValues(req: Request): Record<string, string> {
  return Object.fromEntries(
    ["response_type", "client_id", "redirect_uri", "scope", "state", "code_challenge", "code_challenge_method"]
      .map((key) => [key, String(req.query[key] ?? "")]),
  );
}

export function createOAuthRouter(config: BriefsConfig, auth: AuthStore, mailer: OtpMailer): Router {
  const router = Router();
  const issuer = config.oauthIssuer;

  router.get("/.well-known/oauth-authorization-server", (_req, res) => {
    res.json({
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      userinfo_endpoint: `${issuer}/oidc/me`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: ["openid", "email", "profile", "offline_access"],
      registration_endpoint: `${issuer}/register`,
    });
  });

  router.post("/register", async (req, res, next) => {
    try {
      const redirectUris = Array.isArray(req.body?.redirect_uris)
        ? req.body.redirect_uris.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
        : [];
      if (redirectUris.length === 0) {
        res.status(400).json({ error: "invalid_client_metadata" });
        return;
      }
      const clientId = `briefs-${randomUUID()}`;
      const client = await auth.registerOAuthClient({
        clientId,
        redirectUris,
        clientName: typeof req.body.client_name === "string" ? req.body.client_name : undefined,
      });
      res.status(201).json({
        client_id: client.clientId,
        client_name: client.clientName,
        redirect_uris: client.redirectUris,
        grant_types: ["authorization_code"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/authorize", async (req, res, next) => {
    const values = challengeValues(req);
    try {
      if (values.response_type !== "code" || values.code_challenge_method !== "S256" || !values.code_challenge || !(await isAllowedClient(config, auth, values.client_id, values.redirect_uri))) {
        res.status(400).send("Invalid OAuth authorization request");
        return;
      }
      res.type("html").send(formPage("Sign in to Briefs", `<h1>Sign in to Briefs</h1><p>We’ll email you a one-time sign-in code.</p><form method="post" action="${issuer}/authorize/request">${hiddenFields(values)}<label>Email<input name="email" type="email" autocomplete="email" required></label><button>Send code</button></form>`));
    } catch (error) {
      next(error);
    }
  });

  router.post("/authorize/request", async (req, res, next) => {
    try {
      const values = Object.fromEntries(
        ["response_type", "client_id", "redirect_uri", "scope", "state", "code_challenge", "code_challenge_method"]
          .map((key) => [key, String(req.body[key] ?? "")]),
      );
      const email = normalizeEmail(String(req.body.email ?? ""));
      if (values.response_type !== "code" || values.code_challenge_method !== "S256" || !values.code_challenge || !(await isAllowedClient(config, auth, values.client_id, values.redirect_uri)) || !isValidEmail(email) || !isAllowedEmail(config, email)) {
        res.status(400).send("Invalid OAuth authorization request");
        return;
      }

      if (await auth.hasRecentOtp(email, new Date(Date.now() - 60_000))) {
        res.status(429).send("A sign-in code was already sent recently. Please wait a minute.");
        return;
      }

      const code = String(process.env.DEV_OTP_CODE ?? randomInt(100000, 1000000));
      const challenge = await auth.createOtpChallenge({
        email,
        codeHash: hash(code),
        expiresAt: new Date(Date.now() + config.otpTtlSeconds * 1000),
      });
      await mailer.sendOtp(email, code);
      res.type("html").send(formPage("Enter your code", `<h1>Check your email</h1><p>Enter the six-digit code we sent to ${escapeHtml(email)}.</p><form method="post" action="${issuer}/authorize/verify">${hiddenFields(values)}<input type="hidden" name="challenge_id" value="${challenge.id}"><label>Code<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" required></label><button>Verify and continue</button></form>`));
    } catch (error) {
      next(error);
    }
  });

  router.post("/authorize/verify", async (req, res, next) => {
    try {
      const values = Object.fromEntries(
        ["response_type", "client_id", "redirect_uri", "scope", "state", "code_challenge", "code_challenge_method"]
          .map((key) => [key, String(req.body[key] ?? "")]),
      );
      const challengeId = String(req.body.challenge_id ?? "");
      const challenge = await auth.getOtpChallenge(challengeId);
      const submitted = String(req.body.code ?? "");
      if (!challenge || challenge.consumedAt || challenge.expiresAt.getTime() < Date.now() || challenge.attempts >= MAX_OTP_ATTEMPTS) {
        res.status(400).send("This code has expired. Start sign-in again.");
        return;
      }
      if (hash(submitted) !== challenge.codeHash) {
        await auth.incrementOtpAttempt(challenge.id);
        res.status(400).send("Invalid sign-in code.");
        return;
      }
      await auth.consumeOtpChallenge(challenge.id);

      const rawCode = randomUUID();
      await auth.createAuthorizationCode({
        codeHash: hash(rawCode),
        clientId: values.client_id,
        redirectUri: values.redirect_uri,
        codeChallenge: values.code_challenge,
        userId: challenge.email,
        email: challenge.email,
        expiresAt: new Date(Date.now() + 5 * 60_000),
      });
      const callback = new URL(values.redirect_uri);
      callback.searchParams.set("code", rawCode);
      if (values.state) callback.searchParams.set("state", values.state);
      res.redirect(callback.toString());
    } catch (error) {
      next(error);
    }
  });

  router.post("/token", async (req, res, next) => {
    try {
      const { grant_type: grantType, code, client_id: clientId, redirect_uri: redirectUri, code_verifier: verifier, refresh_token: refreshToken } = req.body as Record<string, string>;
      if (grantType === "refresh_token") {
        const claims = await verifyAccessToken(refreshToken ?? "", config.authSecret, issuer, "refresh");
        if (!claims || clientId !== config.oauthClientId) {
          res.status(400).json({ error: "invalid_grant" });
          return;
        }
        const accessToken = await issueAccessToken({ sub: claims.sub, email: claims.email, iss: issuer }, config.authSecret);
        res.json({ access_token: accessToken, refresh_token: refreshToken, token_type: "Bearer", expires_in: 3600, scope: "openid email profile" });
        return;
      }
      const authorization = code ? await auth.consumeAuthorizationCode(hash(code)) : undefined;
      if (grantType !== "authorization_code" || !authorization || authorization.expiresAt.getTime() < Date.now() || !(await isAllowedClient(config, auth, clientId, redirectUri)) || !verifier) {
        res.status(400).json({ error: "invalid_grant" });
        return;
      }
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
      const encoded = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      if (encoded !== authorization.codeChallenge) {
        res.status(400).json({ error: "invalid_grant" });
        return;
      }
      const accessToken = await issueAccessToken({ sub: authorization.userId, email: authorization.email, iss: issuer }, config.authSecret);
      const issuedRefreshToken = await issueAccessToken({ sub: authorization.userId, email: authorization.email, iss: issuer, tokenUse: "refresh" }, config.authSecret, 30 * 24 * 60 * 60);
      res.json({ access_token: accessToken, refresh_token: issuedRefreshToken, token_type: "Bearer", expires_in: 3600, scope: "openid email profile" });
    } catch (error) {
      next(error);
    }
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
