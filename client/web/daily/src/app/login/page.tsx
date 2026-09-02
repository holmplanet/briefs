import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  buildAuthorizeUrl,
  createOAuthState,
  createPkcePair,
  getSession,
  isOAuthEnabled,
  loadAuthConfig,
  safeNextPath,
} from "@/lib/auth";
import { getInProcessOAuthFetch } from "@/lib/auth/in-process-oauth";
import { buildPendingOtpRedirect } from "@/lib/auth/pending";
import { OtpForm } from "./otp-form";

const OAUTH_STATE_COOKIE = "briefs_oauth_state";
const OAUTH_VERIFIER_COOKIE = "briefs_oauth_verifier";
const BETTER_AUTH_PENDING_EMAIL_COOKIE = "briefs_better_auth_pending_email";
const BETTER_AUTH_PENDING_QUERY_COOKIE = "briefs_better_auth_pending_query";
const BETTER_AUTH_PENDING_TTL_SECONDS = 600;

function splitSetCookieHeader(setCookie: string): string[] {
  const result: string[] = [];
  let start = 0;
  let index = 0;
  while (index < setCookie.length) {
    if (setCookie[index] === ",") {
      let next = index + 1;
      while (next < setCookie.length && setCookie[next] === " ") next += 1;
      while (next < setCookie.length && setCookie[next] !== "=" && setCookie[next] !== ";" && setCookie[next] !== ",") {
        next += 1;
      }
      if (setCookie[next] === "=") {
        const value = setCookie.slice(start, index).trim();
        if (value) result.push(value);
        start = index + 1;
        while (start < setCookie.length && setCookie[start] === " ") start += 1;
        index = start;
        continue;
      }
    }
    index += 1;
  }
  const last = setCookie.slice(start).trim();
  if (last) result.push(last);
  return result;
}

function applyBetterAuthSessionCookies(response: Response, cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = headers.getSetCookie?.() ?? splitSetCookieHeader(headers.get("set-cookie") ?? "");
  let sessionCookieSet = false;

  for (const setCookie of setCookies) {
    const [nameValue] = setCookie.split(";", 1);
    const separator = nameValue.indexOf("=");
    if (separator <= 0) continue;
    const name = nameValue.slice(0, separator);
    const value = nameValue.slice(separator + 1);
    cookieStore.set({
      name,
      value,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    if (name.includes("session_token")) sessionCookieSet = true;
  }

  return sessionCookieSet;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  const config = loadAuthConfig();
  const requestCookies = await cookies();
  const pendingEmail = requestCookies.get(BETTER_AUTH_PENDING_EMAIL_COOKIE)?.value ?? "";
  const pendingOAuthQuery = requestCookies.get(BETTER_AUTH_PENDING_QUERY_COOKIE)?.value ?? "";
  const session = await getSession(config);

  if (session && (!isOAuthEnabled(config) || session.accessToken)) {
    redirect(nextPath);
  }

  if (!isOAuthEnabled(config)) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
        <div className="glass-panel space-y-4 rounded-3xl p-8">
          <p className="text-sm font-medium text-blue-300/80">Briefs</p>
          <h1 className="text-2xl font-medium tracking-[-0.03em]">Development mode</h1>
          <p className="text-sm text-muted-foreground">
            OAuth is not configured. Daily is using the dev user{" "}
            <code className="rounded-full bg-background/60 px-2 py-0.5">{config.devUserId}</code>.
            Set <code className="rounded-full bg-background/60 px-2 py-0.5">OAUTH_ISSUER</code>{" "}
            to the Briefs OAuth issuer to enable sign-in.
          </p>
          <a
            href={nextPath}
            className="inline-flex w-fit rounded-full border border-border bg-card/50 px-4 py-2 text-sm font-medium hover:bg-card/80"
          >
            Continue to Daily
          </a>
        </div>
      </main>
    );
  }

  async function startLogin(formData: FormData) {
    "use server";

    const authConfig = loadAuthConfig();
    const state = createOAuthState();
    const { verifier, challenge } = createPkcePair();
    const next = safeNextPath(String(formData.get("next") ?? "/"));
    const authorizeUrl = await buildAuthorizeUrl(
      authConfig,
      state,
      challenge,
      await getInProcessOAuthFetch(),
    );
    const cookieStore = await cookies();

    cookieStore.set(OAUTH_STATE_COOKIE, `${state}:${next}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    cookieStore.set(OAUTH_VERIFIER_COOKIE, verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    redirect(authorizeUrl);
  }

  async function sendBetterAuthOtp(formData: FormData) {
    "use server";

    const authConfig = loadAuthConfig();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const next = safeNextPath(String(formData.get("next") ?? "/"));
    const oauthQuery = String(formData.get("oauth_query") ?? "");

    if (!email || !email.includes("@")) {
      redirect(`/login?error=${encodeURIComponent("Enter a valid email")}&next=${encodeURIComponent(next)}`);
    }

    const response = await (await getInProcessOAuthFetch())(
      `${authConfig.issuer}/email-otp/send-verification-otp`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, type: "sign-in" }),
      },
    );
    if (!response.ok) {
      const detail = await response.text();
      redirect(`/login?error=${encodeURIComponent(detail || "Unable to send sign-in code")}&next=${encodeURIComponent(next)}`);
    }

    const cookieStore = await cookies();
    cookieStore.set(BETTER_AUTH_PENDING_EMAIL_COOKIE, email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: BETTER_AUTH_PENDING_TTL_SECONDS,
    });
    if (oauthQuery) {
      cookieStore.set(BETTER_AUTH_PENDING_QUERY_COOKIE, oauthQuery, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: BETTER_AUTH_PENDING_TTL_SECONDS,
      });
    }
    redirect(buildPendingOtpRedirect(next));
  }

  const isBetterAuthProviderLogin = config.authProvider === "better-auth"
    && typeof params.client_id === "string"
    && typeof params.response_type === "string"
    && typeof params.redirect_uri === "string";
  const isPendingBetterAuthLogin = config.authProvider === "better-auth"
    && params.otp === "sent"
    && Boolean(pendingEmail && pendingOAuthQuery);
  const betterAuthOtpPending = (isBetterAuthProviderLogin && params.otp === "sent") || isPendingBetterAuthLogin;
  const oauthQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (["email", "error", "next", "otp"].includes(key)) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) oauthQuery.append(key, item);
    }
  }
  const oauthQueryValue = oauthQuery.toString() || pendingOAuthQuery;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <div className="glass-panel space-y-6 rounded-3xl p-8">
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-300/80">Briefs</p>
          <h1 className="text-2xl font-medium tracking-[-0.03em]">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            View your tasks here. Create and update them through your MCP client — the same OAuth
            identity powers both.
          </p>
        </div>

        {params.error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {params.error}
          </p>
        ) : null}

        {betterAuthOtpPending ? (
          <OtpForm email={pendingEmail || String(params.email ?? "")} next={nextPath} oauthQuery={oauthQueryValue} />
        ) : isBetterAuthProviderLogin ? (
          <form action={sendBetterAuthOtp} className="space-y-3">
            <input type="hidden" name="next" value={nextPath} />
            <input type="hidden" name="oauth_query" value={oauthQueryValue} />
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">Email</span>
              <input name="email" type="email" autoComplete="email" required className="w-full rounded-xl border border-border bg-background/60 px-3 py-2" />
            </label>
            <button type="submit" className="w-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20">
              Send sign-in code
            </button>
          </form>
        ) : (
          <form action={startLogin}>
            <input type="hidden" name="next" value={nextPath} />
            <button type="submit" className="w-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20">
              Continue with email
            </button>
          </form>
        )}

        <p className="text-xs text-muted-foreground">
          Uses Briefs OAuth 2.1 + PKCE with email OTP.
        </p>
      </div>
    </main>
  );
}
