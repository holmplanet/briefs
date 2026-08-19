import { createHash, randomInt, randomUUID } from "node:crypto";

import { issueAccessToken, verifyAccessToken } from "@briefs/shared/auth";

import type { AppContext } from "./bootstrap.js";

const MAX_OTP_ATTEMPTS = 5;

export async function handleWebOAuthRequest(request: Request, context: AppContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/oauth\/?/, "");
  if (path === ".well-known/oauth-authorization-server" && request.method === "GET") {
    const issuer = context.config.oauthIssuer;
    return json({
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      userinfo_endpoint: `${issuer}/oidc/me`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: ["openid", "email", "profile", "offline_access"],
    });
  }
  if (path === "authorize" && request.method === "GET") return authorizePage(url, context);
  if (path === "authorize/request" && request.method === "POST") return requestOtp(request, context);
  if (path === "authorize/verify" && request.method === "POST") return verifyOtp(request, context);
  if (path === "token" && request.method === "POST") return exchangeToken(request, context);
  if (path === "oidc/me" && request.method === "GET") return userInfo(request, context);
  return json({ error: "Not found" }, 404);
}

function authorizePage(url: URL, context: AppContext): Response {
  const values = queryValues(url.searchParams);
  if (!validAuthorization(values, context)) return text("Invalid OAuth authorization request", 400);
  return html(formPage("Sign in to Briefs", `<h1>Sign in to Briefs</h1><p>We’ll email you a one-time sign-in code.</p><form method="post" action="${context.config.oauthIssuer}/authorize/request">${hiddenFields(values)}<label>Email<input name="email" type="email" autocomplete="email" required></label><button>Send code</button></form>`));
}

async function requestOtp(request: Request, context: AppContext): Promise<Response> {
  const form = await request.formData();
  const values = formValues(form);
  const email = normalizeEmail(String(form.get("email") ?? ""));
  if (!validAuthorization(values, context) || !isValidEmail(email)) return text("Invalid OAuth authorization request", 400);
  if (await context.auth.hasRecentOtp(email, new Date(Date.now() - 60_000))) return text("A sign-in code was already sent recently. Please wait a minute.", 429);
  const code = String(process.env.BRIEFS_DEV_OTP_CODE ?? randomInt(100000, 1000000));
  const challenge = await context.auth.createOtpChallenge({ email, codeHash: hash(code), expiresAt: new Date(Date.now() + context.config.otpTtlSeconds * 1000) });
  await context.mailer.sendOtp(email, code);
  return html(formPage("Enter your code", `<h1>Check your email</h1><p>Enter the six-digit code we sent to ${escapeHtml(email)}.</p><form method="post" action="${context.config.oauthIssuer}/authorize/verify">${hiddenFields(values)}<input type="hidden" name="challenge_id" value="${challenge.id}"><label>Code<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" required></label><button>Verify and continue</button></form>`));
}

async function verifyOtp(request: Request, context: AppContext): Promise<Response> {
  const form = await request.formData();
  const values = formValues(form);
  const challengeId = String(form.get("challenge_id") ?? "");
  const challenge = await context.auth.getOtpChallenge(challengeId);
  if (!challenge || challenge.consumedAt || challenge.expiresAt.getTime() < Date.now() || challenge.attempts >= MAX_OTP_ATTEMPTS) return text("This code has expired. Start sign-in again.", 400);
  if (hash(String(form.get("code") ?? "")) !== challenge.codeHash) {
    await context.auth.incrementOtpAttempt(challenge.id);
    return text("Invalid sign-in code.", 400);
  }
  await context.auth.consumeOtpChallenge(challenge.id);
  const rawCode = randomUUID();
  await context.auth.createAuthorizationCode({ codeHash: hash(rawCode), clientId: values.client_id, redirectUri: values.redirect_uri, codeChallenge: values.code_challenge, userId: challenge.email, email: challenge.email, expiresAt: new Date(Date.now() + 5 * 60_000) });
  const callback = new URL(values.redirect_uri);
  callback.searchParams.set("code", rawCode);
  if (values.state) callback.searchParams.set("state", values.state);
  return Response.redirect(callback.toString(), 302);
}

async function exchangeToken(request: Request, context: AppContext): Promise<Response> {
  const form = await request.formData();
  const code = String(form.get("code") ?? "");
  const clientId = String(form.get("client_id") ?? "");
  const redirectUri = String(form.get("redirect_uri") ?? "");
  const verifier = String(form.get("code_verifier") ?? "");
  const authorization = code ? await context.auth.consumeAuthorizationCode(hash(code)) : undefined;
  if (String(form.get("grant_type") ?? "") !== "authorization_code" || !authorization || authorization.expiresAt.getTime() < Date.now() || !isAllowedClient(context, clientId, redirectUri) || !verifier) return json({ error: "invalid_grant" }, 400);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const encoded = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  if (encoded !== authorization.codeChallenge) return json({ error: "invalid_grant" }, 400);
  const accessToken = await issueAccessToken({ sub: authorization.userId, email: authorization.email, iss: context.config.oauthIssuer }, context.config.authSecret);
  return json({ access_token: accessToken, token_type: "Bearer", expires_in: 3600, scope: "openid email profile" });
}

async function userInfo(request: Request, context: AppContext): Promise<Response> {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/, "");
  const claims = await verifyAccessToken(token, context.config.authSecret, context.config.oauthIssuer);
  return claims ? json({ sub: claims.sub, email: claims.email }) : json({ error: "invalid_token" }, 401);
}

function queryValues(search: URLSearchParams): Record<string, string> { return Object.fromEntries(["response_type", "client_id", "redirect_uri", "scope", "state", "code_challenge", "code_challenge_method"].map((key) => [key, search.get(key) ?? ""])); }
function formValues(form: FormData): Record<string, string> { return Object.fromEntries(["response_type", "client_id", "redirect_uri", "scope", "state", "code_challenge", "code_challenge_method"].map((key) => [key, String(form.get(key) ?? "")])); }
function isAllowedClient(context: AppContext, clientId: string, redirectUri: string): boolean { return clientId === context.config.oauthClientId && context.config.oauthRedirectUris.includes(redirectUri); }
function validAuthorization(values: Record<string, string>, context: AppContext): boolean { return values.response_type === "code" && values.code_challenge_method === "S256" && Boolean(values.code_challenge) && isAllowedClient(context, values.client_id, values.redirect_uri); }
function normalizeEmail(value: string): string { return value.trim().toLowerCase(); }
function isValidEmail(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function hash(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function hiddenFields(values: Record<string, string>): string { return Object.entries(values).map(([key, value]) => `<input type="hidden" name="${key}" value="${escapeHtml(value)}">`).join(""); }
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character); }
function formPage(title: string, body: string): string { return `<!doctype html><meta name="viewport" content="width=device-width"><title>${title}</title><style>body{font:16px system-ui;max-width:420px;margin:15vh auto;padding:24px}input{width:100%;box-sizing:border-box;padding:10px;margin:8px 0 16px}button{padding:10px 16px}</style>${body}`; }
function html(body: string): Response { return new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } }); }
function text(body: string, status = 200): Response { return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } }); }
function json(body: unknown, status = 200): Response { return Response.json(body, { status }); }
