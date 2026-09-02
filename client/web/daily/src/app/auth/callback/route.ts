import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  exchangeCodeForUser,
  createSessionCookieValue,
  loadAuthConfig,
  safeNextPath,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { getInProcessOAuthFetch } from "@/lib/auth/in-process-oauth";

const OAUTH_STATE_COOKIE = "briefs_oauth_state";
const OAUTH_VERIFIER_COOKIE = "briefs_oauth_verifier";

export async function GET(request: Request) {
  const config = loadAuthConfig();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  console.info("[Briefs Daily] OAuth callback received", {
    hasCode: Boolean(code),
    hasState: Boolean(state),
    error: error ?? undefined,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, config.appUrl),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_code", config.appUrl));
  }

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const verifier = cookieStore.get(OAUTH_VERIFIER_COOKIE)?.value;

  console.info("[Briefs Daily] OAuth callback state check", {
    hasStateCookie: Boolean(stateCookie),
    hasVerifier: Boolean(verifier),
    stateMatches: stateCookie ? stateCookie.split(":", 1)[0] === state : false,
  });

  if (!stateCookie || !verifier) {
    return NextResponse.redirect(new URL("/login?error=expired_state", config.appUrl));
  }

  const [expectedState, nextPath] = stateCookie.split(":");
  if (expectedState !== state) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", config.appUrl));
  }

  try {
    const user = await exchangeCodeForUser(config, code, verifier, await getInProcessOAuthFetch());
    console.info("[Briefs Daily] OAuth token exchange succeeded", {
      hasUserId: Boolean(user.userId),
      hasEmail: Boolean(user.email),
      hasRefreshToken: Boolean(user.refreshToken),
    });
    const sessionCookieValue = await createSessionCookieValue(config, {
      userId: user.userId,
      email: user.email,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      accessTokenExpiresAt: user.accessTokenExpiresAt,
    });
    const target = new URL(safeNextPath(nextPath), config.appUrl);
    // A one-time authorization code must only be exchanged once. Returning an
    // HTML meta-refresh plus script can trigger two callback navigations in a
    // browser, making the second request fail with `invalid code`.
    const response = NextResponse.redirect(target, 303);
    response.cookies.set(SESSION_COOKIE, sessionCookieValue, sessionCookieOptions());
    const setCookieHeader = response.headers.get("set-cookie");
    console.info("[Briefs Daily] Daily session attached to callback response", {
      cookieAttached: Boolean(response.cookies.get(SESSION_COOKIE)?.value),
      cookieLength: sessionCookieValue.length,
      serializedCookieAttached: Boolean(setCookieHeader?.includes(SESSION_COOKIE)),
      serializedHeaderLength: setCookieHeader?.length ?? 0,
    });
    return response;
  } catch (callbackError) {
    const message =
      callbackError instanceof Error ? callbackError.message : "Authentication failed";
    console.error("[Briefs Daily] OAuth callback failed", {
      message,
    });
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, config.appUrl),
    );
  }
}
