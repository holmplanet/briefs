import Router from "@koa/router";
import { encodeBriefsSession } from "@briefs/shared/session";
import { decodeBriefsSession } from "@briefs/shared/session";
import { buildAuthorizeUrl, createOAuthState, createPkcePair, exchangeCode, loadFlightAuthConfig } from "./auth.ts";

const router = new Router();

const SESSION_COOKIE = "briefs_daily_session";
const OAUTH_STATE_COOKIE = "briefs_flight_oauth_state";
const OAUTH_VERIFIER_COOKIE = "briefs_flight_oauth_verifier";
const OAUTH_NEXT_COOKIE = "briefs_flight_oauth_next";
type FlightContext = Parameters<Parameters<typeof router.get>[1]>[0];

function providerOrigin(config: ReturnType<typeof loadFlightAuthConfig>): string {
  return config.issuer ? new URL(config.issuer).origin : "";
}

function cookieValue(header: string | undefined, name: string): string | undefined {
  return header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function splitSetCookieHeader(setCookie: string): string[] {
  return setCookie.split(/,(?=\s*[^;,=]+=[^;,]*)/).map((value) => value.trim()).filter(Boolean);
}

function cookieHeader(response: Response): string {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const values = headers.getSetCookie?.() ?? splitSetCookieHeader(headers.get("set-cookie") ?? "");
  return values.map((value) => value.split(";", 1)[0]).join("; ");
}

function secureCookie(context: FlightContext): boolean {
  return process.env.NODE_ENV === "production" && context.secure;
}

function copyProviderCookies(context: FlightContext, response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const values = headers.getSetCookie?.() ?? splitSetCookieHeader(headers.get("set-cookie") ?? "");
  for (const value of values) {
    const [nameValue] = value.split(";", 1);
    const separator = nameValue.indexOf("=");
    if (separator <= 0) continue;
    context.cookies.set(nameValue.slice(0, separator), nameValue.slice(separator + 1), {
      httpOnly: true,
      secure: secureCookie(context),
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
}

async function sessionFromRequest(context: Parameters<Parameters<typeof router.get>[1]>[0]) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return decodeBriefsSession(cookieValue(context.request.headers.cookie, SESSION_COOKIE), secret);
}

async function apiRequest(context: FlightContext, path: string, init?: RequestInit) {
  const session = await sessionFromRequest(context);
  if (!session?.accessToken) return null;

  const apiUrl = (process.env.API_URL ?? "http://localhost:8001").replace(/\/$/, "");
  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${session.accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
}

router.get("/api/flight/health", (context) => {
  context.body = { status: "ok", service: "briefs-flight-spike" };
});

router.get("/api/flight/auth/start", async (context) => {
  const config = loadFlightAuthConfig();
  if (!config.issuer || !config.clientId) { context.status = 503; context.body = { error: "OAuth issuer and client ID are required" }; return; }
  const state = createOAuthState();
  const { verifier, challenge } = createPkcePair();
  context.cookies.set(OAUTH_STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", secure: secureCookie(context), path: "/", maxAge: 10 * 60 * 1000 });
  context.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, { httpOnly: true, sameSite: "lax", secure: secureCookie(context), path: "/", maxAge: 10 * 60 * 1000 });
  const next = typeof context.query.next === "string" && context.query.next.startsWith("/") && !context.query.next.startsWith("//") ? context.query.next : "/";
  context.cookies.set(OAUTH_NEXT_COOKIE, next, { httpOnly: true, sameSite: "lax", secure: secureCookie(context), path: "/", maxAge: 10 * 60 * 1000 });
  context.body = { url: await buildAuthorizeUrl(config, state, challenge) };
});

router.post("/api/flight/auth/send-otp", async (context) => {
  const config = loadFlightAuthConfig();
  const body = (context.request as typeof context.request & { body?: { email?: string } }).body ?? {};
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!config.issuer) { context.status = 503; context.body = { error: "OAuth is not configured" }; return; }
  if (!email || !email.includes("@")) { context.status = 400; context.body = { error: "Enter a valid email" }; return; }
  const response = await fetch(`${config.issuer}/email-otp/send-verification-otp`, { method: "POST", headers: { "content-type": "application/json", origin: providerOrigin(config) }, body: JSON.stringify({ email, type: "sign-in" }) });
  if (!response.ok) { context.status = 400; context.body = { error: (await response.text()) || "Unable to send sign-in code" }; return; }
  context.body = { sent: true };
});

router.post("/api/flight/auth/verify-otp", async (context) => {
  const config = loadFlightAuthConfig();
  const body = (context.request as typeof context.request & { body?: { email?: string; otp?: string; oauthQuery?: string } }).body ?? {};
  const email = body.email?.trim().toLowerCase() ?? "";
  const otp = body.otp?.trim() ?? "";
  if (!config.issuer) { context.status = 503; context.body = { error: "OAuth is not configured" }; return; }
  const response = await fetch(`${config.issuer}/sign-in/email-otp`, { method: "POST", headers: { "content-type": "application/json", origin: providerOrigin(config) }, body: JSON.stringify({ email, otp, ...(body.oauthQuery ? { oauth_query: body.oauthQuery } : {}) }) });
  const location = response.headers.get("location");
  const json = response.headers.get("content-type")?.includes("json") ? await response.json() as { url?: string; token?: string; user?: { id?: string; email?: string } } : {};
  if (!response.ok && !location && !json.url) { context.status = 400; context.body = { error: "Invalid sign-in code" }; return; }
  const providerCookies = cookieHeader(response);
  copyProviderCookies(context, response);
  if (!body.oauthQuery && json.user?.id && providerCookies) {
    const tokenResponse = await fetch(`${config.issuer}/token`, {
      headers: { cookie: providerCookies, origin: providerOrigin(config) },
    });
    if (!tokenResponse.ok) { context.status = 502; context.body = { error: "Unable to establish Briefs session" }; return; }
    const token = (await tokenResponse.json() as { token?: string }).token;
    if (!token) { context.status = 502; context.body = { error: "Better Auth did not return an API token" }; return; }
    const session = await encodeBriefsSession({
      userId: json.user.id,
      email: json.user.email,
      accessToken: token,
      accessTokenExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    }, config.sessionSecret);
    context.cookies.set(SESSION_COOKIE, session, { httpOnly: true, secure: secureCookie(context), sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60 * 1000 });
  }
  const continuation = location
    ?? json.url
    ?? (body.oauthQuery ? `${config.issuer}/oauth2/authorize?${body.oauthQuery}` : `${config.appUrl}/`);
  context.body = { continuation };
});

router.post("/api/flight/auth/consent", async (context) => {
  const config = loadFlightAuthConfig();
  const body = (context.request as typeof context.request & { body?: { oauthQuery?: string } }).body ?? {};
  if (!config.issuer) { context.status = 503; context.body = { error: "OAuth is not configured" }; return; }
  const response = await fetch(`${config.issuer}/oauth2/consent`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: providerOrigin(config), ...(context.request.headers.cookie ? { cookie: context.request.headers.cookie } : {}) },
    body: JSON.stringify({ accept: true, ...(body.oauthQuery ? { oauth_query: body.oauthQuery } : {}) }),
  });
  const result = response.headers.get("content-type")?.includes("json") ? await response.json() as { url?: string; redirect_uri?: string; error?: string } : {};
  if (!response.ok) { context.status = 400; context.body = { error: result.error ?? "Unable to approve access" }; return; }
  copyProviderCookies(context, response);
  context.body = { continuation: result.url ?? result.redirect_uri ?? response.headers.get("location") };
});

router.get("/api/flight/auth/session", async (context) => {
  const session = await sessionFromRequest(context);
  context.body = session
    ? { authenticated: true, user: { id: session.userId, email: session.email } }
    : { authenticated: false };
});

router.get("/api/flight/auth/logout", (context) => {
  context.cookies.set(SESSION_COOKIE, "", { expires: new Date(0), path: "/" });
  context.redirect("/login");
});

router.get("/auth/callback", async (context) => {
  const config = loadFlightAuthConfig();
  const code = typeof context.query.code === "string" ? context.query.code : "";
  const state = typeof context.query.state === "string" ? context.query.state : "";
  const expectedState = context.cookies.get(OAUTH_STATE_COOKIE);
  const verifier = context.cookies.get(OAUTH_VERIFIER_COOKIE);
  const next = context.cookies.get(OAUTH_NEXT_COOKIE) ?? "/";
  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    context.redirect(`${config.appUrl}/login?error=invalid_state`); return;
  }
  try {
    const user = await exchangeCode(config, code, verifier);
    const value = await encodeBriefsSession({ userId: user.userId, email: user.email, accessToken: user.accessToken, refreshToken: user.refreshToken, accessTokenExpiresAt: user.accessTokenExpiresAt, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }, config.sessionSecret);
    context.cookies.set(SESSION_COOKIE, value, { httpOnly: true, secure: secureCookie(context), sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60 * 1000 });
    context.cookies.set(OAUTH_STATE_COOKIE, "", { expires: new Date(0), path: "/", secure: secureCookie(context) });
    context.cookies.set(OAUTH_VERIFIER_COOKIE, "", { expires: new Date(0), path: "/", secure: secureCookie(context) });
    context.cookies.set(OAUTH_NEXT_COOKIE, "", { expires: new Date(0), path: "/", secure: secureCookie(context) });
    context.redirect(`${config.appUrl}${next}`);
  } catch (error) {
    context.redirect(`${config.appUrl}/login?error=${encodeURIComponent(error instanceof Error ? error.message : "Authentication failed")}`);
  }
});

router.get("/api/flight/items", async (context) => {
  const response = await apiRequest(context, `/api/v1/items${typeof context.query.status === "string" ? `?status=${encodeURIComponent(context.query.status)}` : ""}`);
  if (!response) {
    context.status = 401;
    context.body = { error: "unauthorized", error_description: "Valid Briefs session required" };
    return;
  }
  context.status = response.status;
  context.body = await response.json();
});

router.get("/api/flight/items/:itemId", async (context) => {
  const response = await apiRequest(context, `/api/v1/items/${encodeURIComponent(context.params.itemId)}`);
  if (!response) {
    context.status = 401;
    context.body = { error: "unauthorized", error_description: "Valid Briefs session required" };
    return;
  }
  context.status = response.status;
  context.body = await response.json();
});

router.get("/api/flight/items/:itemId/activities", async (context) => {
  const response = await apiRequest(context, `/api/v1/items/${encodeURIComponent(context.params.itemId)}/activities`);
  if (!response) {
    context.status = 401;
    context.body = { error: "unauthorized", error_description: "Valid Briefs session required" };
    return;
  }
  context.status = response.status;
  context.body = await response.json();
});

router.post("/api/flight/items", async (context) => {
  const body = (context.request as typeof context.request & { body?: unknown }).body;
  const response = await apiRequest(context, "/api/v1/items", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!response) {
    context.status = 401;
    context.body = { error: "unauthorized", error_description: "Valid Briefs session required" };
    return;
  }
  context.status = response.status;
  context.body = await response.json();
});

export default router.routes();
