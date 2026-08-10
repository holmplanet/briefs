import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  exchangeCodeForUser,
  loadAuthConfig,
  setSession,
} from "@/lib/auth";

const OAUTH_STATE_COOKIE = "briefs_oauth_state";
const OAUTH_VERIFIER_COOKIE = "briefs_oauth_verifier";

export async function GET(request: Request) {
  const config = loadAuthConfig();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

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

  if (!stateCookie || !verifier) {
    return NextResponse.redirect(new URL("/login?error=expired_state", config.appUrl));
  }

  const [expectedState, nextPath] = stateCookie.split(":");
  if (expectedState !== state) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", config.appUrl));
  }

  try {
    const user = await exchangeCodeForUser(config, code, verifier);
    await setSession(config, {
      userId: user.userId,
      email: user.email,
      accessToken: user.accessToken,
    });
  } catch (callbackError) {
    const message =
      callbackError instanceof Error ? callbackError.message : "Authentication failed";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, config.appUrl),
    );
  } finally {
    cookieStore.delete(OAUTH_STATE_COOKIE);
    cookieStore.delete(OAUTH_VERIFIER_COOKIE);
  }

  return NextResponse.redirect(new URL(nextPath || "/", config.appUrl));
}
