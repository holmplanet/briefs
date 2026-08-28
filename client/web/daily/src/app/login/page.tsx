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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const config = loadAuthConfig();
  const session = await getSession(config);

  if (session && (!isOAuthEnabled(config) || session.accessToken)) {
    redirect(nextPath);
  }

  if (!isOAuthEnabled(config)) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
        <div className="glass-panel space-y-4 rounded-3xl p-8">
          <p className="text-sm font-medium text-blue-300/80">Briefs Daily</p>
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

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <div className="glass-panel space-y-6 rounded-3xl p-8">
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-300/80">Briefs Daily</p>
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

        <form action={startLogin}>
            <input type="hidden" name="next" value={nextPath} />
          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20"
          >
            Continue with email
          </button>
        </form>

        <p className="text-xs text-muted-foreground">
          Uses Briefs OAuth 2.1 + PKCE with email OTP.
        </p>
      </div>
    </main>
  );
}
