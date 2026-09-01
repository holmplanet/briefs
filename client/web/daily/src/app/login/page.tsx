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

const OAUTH_STATE_COOKIE = "briefs_oauth_state";
const OAUTH_VERIFIER_COOKIE = "briefs_oauth_verifier";

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
    if (!email || !email.includes("@")) {
      redirect(`/login?error=Enter%20a%20valid%20email&next=${encodeURIComponent(next)}`);
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
    redirect(`/login?otp=sent&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
  }

  async function finishBetterAuthLogin(formData: FormData) {
    "use server";

    const authConfig = loadAuthConfig();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const otp = String(formData.get("otp") ?? "").trim();
    const next = safeNextPath(String(formData.get("next") ?? "/"));
    const oauthQuery = String(formData.get("oauth_query") ?? "");
    const response = await (await getInProcessOAuthFetch())(
      `${authConfig.issuer}/sign-in/email-otp`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, otp, ...(oauthQuery ? { oauth_query: oauthQuery } : {}) }),
      },
    );
    if (!response.ok && !response.headers.get("location")) {
      const detail = await response.text();
      redirect(`/login?otp=sent&email=${encodeURIComponent(email)}&error=${encodeURIComponent(detail || "Invalid sign-in code")}&next=${encodeURIComponent(next)}`);
    }

    const cookieStore = await cookies();
    if (!applyBetterAuthSessionCookies(response, cookieStore) && !response.headers.get("location")) {
      redirect(`/login?error=Authentication%20session%20was%20not%20created&next=${encodeURIComponent(next)}`);
    }

    let continuation = response.headers.get("location") ?? "";
    if (!continuation && response.ok && response.headers.get("content-type")?.includes("application/json")) {
      const result = await response.json() as { redirect?: boolean; url?: string };
      if (result.redirect && result.url) continuation = result.url;
    }
    if (continuation) {
      redirect(new URL(continuation, authConfig.issuer ?? "http://localhost").toString());
    }

    const state = createOAuthState();
    const { verifier, challenge } = createPkcePair();
    const authorizeUrl = await buildAuthorizeUrl(
      authConfig,
      state,
      challenge,
      await getInProcessOAuthFetch(),
    );
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

  const betterAuthOtpPending = config.authProvider === "better-auth" && params.otp === "sent";
  const oauthQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (["email", "error", "next", "otp"].includes(key)) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) oauthQuery.append(key, item);
    }
  }

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
          <form action={finishBetterAuthLogin} className="space-y-3">
            <input type="hidden" name="email" value={params.email ?? ""} />
            <input type="hidden" name="next" value={nextPath} />
            <input type="hidden" name="oauth_query" value={oauthQuery.toString()} />
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">Email code</span>
              <input name="otp" inputMode="numeric" autoComplete="one-time-code" required className="w-full rounded-xl border border-border bg-background/60 px-3 py-2" />
            </label>
            <button type="submit" className="w-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20">
              Verify and continue
            </button>
          </form>
        ) : config.authProvider === "better-auth" ? (
          <form action={sendBetterAuthOtp} className="space-y-3">
            <input type="hidden" name="next" value={nextPath} />
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
