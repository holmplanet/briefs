import { createHash, randomInt, randomUUID } from "node:crypto";

import { issueAccessToken, verifyAccessToken } from "@briefs/shared/auth";

import type { AppContext } from "./bootstrap.js";

const MAX_OTP_ATTEMPTS = 5;

export async function handleWebOAuthRequest(request: Request, context: AppContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/oauth\/?/, "");

  if ((path === ".well-known/oauth-authorization-server" || path === ".well-known/openid-configuration") && request.method === "GET") {
    const issuer = context.config.oauthIssuer;
    return json({
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
  }

  if (path === "register" && request.method === "POST") return registerClient(request, context);
  if (path === "authorize" && request.method === "GET") return authorizePage(url, context);
  if (path === "authorize/request" && request.method === "POST") return requestOtp(request, context);
  if (path === "authorize/verify" && request.method === "POST") return verifyOtp(request, context);
  if (path === "token" && request.method === "POST") return exchangeToken(request, context);
  if (path === "oidc/me" && request.method === "GET") return userInfo(request, context);

  return json({ error: "Not found" }, 404);
}

async function registerClient(request: Request, context: AppContext): Promise<Response> {
  const body = await request.json().catch(() => null) as { redirect_uris?: unknown; client_name?: unknown } | null;
  const redirectUris = Array.isArray(body?.redirect_uris)
    ? body.redirect_uris.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];
  const clientName = typeof body?.client_name === "string" ? body.client_name.trim().slice(0, 120) : undefined;
  if (
    redirectUris.length === 0 ||
    redirectUris.length > 10 ||
    new Set(redirectUris).size !== redirectUris.length ||
    redirectUris.some((redirectUri) => !isSafeRedirectUri(redirectUri, context))
  ) {
    return json({ error: "invalid_client_metadata" }, 400);
  }

  const client = await context.auth.registerOAuthClient({
    clientId: `briefs-${randomUUID()}`,
    redirectUris,
    clientName,
  });
  return json({
    client_id: client.clientId,
    client_name: client.clientName,
    redirect_uris: client.redirectUris,
    grant_types: ["authorization_code"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  }, 201);
}

async function authorizePage(url: URL, context: AppContext): Promise<Response> {
  const values = queryValues(url.searchParams);
  if (!(await validAuthorization(values, context))) return text("Invalid OAuth authorization request", 400);
  const client = await getOAuthClient(context, values.client_id);
  if (!client) return text("Invalid OAuth authorization request", 400);

  return html(formPage(
    "Sign in to Briefs",
    `<h1>Sign in to Briefs</h1><p><strong>${escapeHtml(client.clientName)}</strong> is requesting access for <code>${escapeHtml(new URL(values.redirect_uri).origin)}</code>.</p><p>We’ll email you a one-time sign-in code.</p><form method="post" action="${context.config.oauthIssuer}/authorize/request">${hiddenFields(values)}<label><input name="consent" type="checkbox" value="on" required> I recognize this client and approve access.</label><label>Email<input name="email" type="email" autocomplete="email" required></label><button>Send code</button></form>`,
  ));
}

async function requestOtp(request: Request, context: AppContext): Promise<Response> {
  const form = await request.formData();
  const values = formValues(form);
  const email = normalizeEmail(String(form.get("email") ?? ""));

  if (!(await validAuthorization(values, context))) {
    return text("Invalid OAuth authorization request", 400);
  }
  if (form.get("consent") !== "on") {
    return html(authorizeForm(values, context.config.oauthIssuer, email, "Confirm that you recognize this client before continuing."), 400);
  }
  if (!isValidEmail(email)) {
    return html(authorizeForm(values, context.config.oauthIssuer, email, "Enter a valid email address."), 400);
  }
  if (!isAllowedEmail(context, email)) {
    return html(authorizeForm(values, context.config.oauthIssuer, email, "That email is not authorized for this Briefs account."), 403);
  }
  if (await context.auth.hasRecentOtp(email, new Date(Date.now() - 60_000))) {
    return html(authorizeForm(values, context.config.oauthIssuer, email, "A sign-in code was already sent recently. Please wait a minute."), 429);
  }

  const code = String(process.env.DEV_OTP_CODE ?? randomInt(100000, 1000000));
  const challenge = await context.auth.createOtpChallenge({
    email,
    codeHash: hash(code),
    expiresAt: new Date(Date.now() + context.config.otpTtlSeconds * 1000),
  });
  await context.mailer.sendOtp(email, code);

  return html(formPage(
    "Enter your code",
    `<h1>Check your email</h1><p>Enter the six-digit code we sent to ${escapeHtml(email)}.</p><form method="post" action="${context.config.oauthIssuer}/authorize/verify">${hiddenFields(values)}<input type="hidden" name="challenge_id" value="${challenge.id}"><label>Code<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" required></label><button>Verify and continue</button></form>`,
  ));
}

async function verifyOtp(request: Request, context: AppContext): Promise<Response> {
  const form = await request.formData();
  const values = formValues(form);
  if (!(await validAuthorization(values, context))) {
    return text("Invalid OAuth authorization request", 400);
  }
  const challengeId = String(form.get("challenge_id") ?? "");
  const challenge = await context.auth.getOtpChallenge(challengeId);

  if (!challenge || challenge.consumedAt || challenge.expiresAt.getTime() < Date.now() || challenge.attempts >= MAX_OTP_ATTEMPTS) {
    return text("This code has expired. Start sign-in again.", 400);
  }
  if (hash(String(form.get("code") ?? "")) !== challenge.codeHash) {
    await context.auth.incrementOtpAttempt(challenge.id);
    return text("Invalid sign-in code.", 400);
  }

  await context.auth.consumeOtpChallenge(challenge.id);
  const rawCode = randomUUID();
  await context.auth.createAuthorizationCode({
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
  return Response.redirect(callback.toString(), 302);
}

async function exchangeToken(request: Request, context: AppContext): Promise<Response> {
  const form = await request.formData();
  const grantType = String(form.get("grant_type") ?? "");
  const incomingRefreshToken = String(form.get("refresh_token") ?? "");
  const clientId = String(form.get("client_id") ?? "");
  if (grantType === "refresh_token") {
    const claims = await verifyAccessToken(incomingRefreshToken, context.config.authSecret, context.config.oauthIssuer, "refresh");
    if (!claims || clientId !== context.config.oauthClientId) return json({ error: "invalid_grant" }, 400);
    const accessToken = await issueAccessToken(
      { sub: claims.sub, email: claims.email, iss: context.config.oauthIssuer },
      context.config.authSecret,
    );
    return json({ access_token: accessToken, refresh_token: incomingRefreshToken, token_type: "Bearer", expires_in: 3600, scope: "openid email profile" });
  }

  const code = String(form.get("code") ?? "");
  const redirectUri = String(form.get("redirect_uri") ?? "");
  const verifier = String(form.get("code_verifier") ?? "");
  const authorization = code ? await context.auth.consumeAuthorizationCode(hash(code)) : undefined;

  if (String(form.get("grant_type") ?? "") !== "authorization_code" || !authorization || authorization.expiresAt.getTime() < Date.now() || !(await isAllowedClient(context, clientId, redirectUri)) || !verifier) {
    return json({ error: "invalid_grant" }, 400);
  }

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const encoded = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  if (encoded !== authorization.codeChallenge) return json({ error: "invalid_grant" }, 400);

  const accessToken = await issueAccessToken(
    { sub: authorization.userId, email: authorization.email, iss: context.config.oauthIssuer },
    context.config.authSecret,
  );
  const refreshToken = await issueAccessToken(
    { sub: authorization.userId, email: authorization.email, iss: context.config.oauthIssuer, tokenUse: "refresh" },
    context.config.authSecret,
    30 * 24 * 60 * 60,
  );
  return json({ access_token: accessToken, refresh_token: refreshToken, token_type: "Bearer", expires_in: 3600, scope: "openid email profile" });
}

async function userInfo(request: Request, context: AppContext): Promise<Response> {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/, "");
  const claims = await verifyAccessToken(token, context.config.authSecret, context.config.oauthIssuer);
  return claims ? json({ sub: claims.sub, email: claims.email }) : json({ error: "invalid_token" }, 401);
}

function queryValues(search: URLSearchParams): Record<string, string> {
  return formKeys(search.get.bind(search));
}

function formValues(form: FormData): Record<string, string> {
  return formKeys((key) => String(form.get(key) ?? ""));
}

function formKeys(read: (key: string) => string | null): Record<string, string> {
  return Object.fromEntries([
    "response_type",
    "client_id",
    "redirect_uri",
    "scope",
    "state",
    "code_challenge",
    "code_challenge_method",
  ].map((key) => [key, read(key) ?? ""]));
}

async function isAllowedClient(context: AppContext, clientId: string, redirectUri: string): Promise<boolean> {
  if (clientId === context.config.oauthClientId) return context.config.oauthRedirectUris.includes(redirectUri) && isSafeRedirectUri(redirectUri, context);
  const client = await context.auth.getOAuthClient(clientId);
  return Boolean(client?.redirectUris.includes(redirectUri) && isSafeRedirectUri(redirectUri, context));
}

async function validAuthorization(values: Record<string, string>, context: AppContext): Promise<boolean> {
  return values.response_type === "code" && values.code_challenge_method === "S256" && Boolean(values.code_challenge) && await isAllowedClient(context, values.client_id, values.redirect_uri);
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isAllowedEmail(context: AppContext, email: string): boolean {
  return context.config.oauthAllowedEmails.length === 0 || context.config.oauthAllowedEmails.includes(email);
}

async function getOAuthClient(context: AppContext, clientId: string): Promise<{ clientName: string; redirectUris: string[] } | undefined> {
  if (clientId === context.config.oauthClientId) {
    return { clientName: "Briefs Daily", redirectUris: context.config.oauthRedirectUris };
  }
  const client = await context.auth.getOAuthClient(clientId);
  return client
    ? { clientName: client.clientName ?? `OAuth client ${clientId}`, redirectUris: client.redirectUris }
    : undefined;
}

function isSafeRedirectUri(value: string, context: AppContext): boolean {
  if (context.config.oauthAllowedRedirectUris.includes(value) || context.config.oauthRedirectUris.includes(value)) return true;

  try {
    const url = new URL(value);
    const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    return loopback && url.protocol === "http:" && Boolean(url.port) && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hiddenFields(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${escapeHtml(value)}">`)
    .join("");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function formPage(title: string, body: string): string {
  return `<!doctype html><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title><style>:root{color-scheme:dark}body{font:16px system-ui;max-width:420px;margin:15vh auto;padding:24px;background:#0a0a0e;color:#f5f5f5}main{border:1px solid #292934;border-radius:24px;padding:28px;background:#14141b;box-shadow:0 20px 60px #0008}p{color:#a8a8b8;line-height:1.5}label{display:block;color:#d8d8e2}input{width:100%;box-sizing:border-box;padding:11px 12px;margin:8px 0 16px;border:1px solid #393946;border-radius:10px;background:#0d0d12;color:#fff;font:inherit}button{padding:11px 16px;border:0;border-radius:999px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);color:#fff;font:inherit;font-weight:600;cursor:pointer}.error{padding:10px 12px;border:1px solid #9f3d50;border-radius:12px;background:#4a1824;color:#ffc4cf}</style><main>${body}</main>`;
}

function authorizeForm(values: Record<string, string>, issuer: string, email = "", error?: string): string {
  const errorMarkup = error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : "";
  return formPage(
    "Sign in to Briefs",
    `<h1>Sign in to Briefs</h1><p>We’ll email you a one-time sign-in code.</p>${errorMarkup}<form method="post" action="${escapeHtml(issuer)}/authorize/request">${hiddenFields(values)}<label><input name="consent" type="checkbox" value="on" required> I recognize this client and approve access.</label><label>Email<input name="email" type="email" autocomplete="email" value="${escapeHtml(email)}" required></label><button>Send code</button></form>`,
  );
}

function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

function text(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}
