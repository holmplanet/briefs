import { NextResponse, type NextRequest } from "next/server";

import { loadAuthConfig, isOAuthEnabled } from "@/lib/auth/config";
import { refreshAccessToken } from "@/lib/auth/oauth";
import { SESSION_COOKIE, decodeSessionValue, encodeSessionValue, sessionCookieOptions } from "@/lib/auth/session";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/logout", "/register", "/api/health", "/api/mcp", "/api/v1"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    pathname === "/oauth" ||
    pathname.startsWith("/oauth/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const config = loadAuthConfig();
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await decodeSessionValue(raw, config.sessionSecret);

  if (session && isOAuthEnabled(config) && !session.accessToken) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    loginUrl.searchParams.set("error", "Your session expired. Please sign in again.");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (session && isOAuthEnabled(config) && session.accessTokenExpiresAt && session.accessTokenExpiresAt <= Date.now() + 60_000) {
    if (!session.refreshToken) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      loginUrl.searchParams.set("error", "Your session expired. Please sign in again.");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    try {
      const refreshed = await refreshAccessToken(config, session.refreshToken);
      const response = NextResponse.next();
      response.cookies.set(
        SESSION_COOKIE,
        await encodeSessionValue({ ...session, ...refreshed }, config.sessionSecret),
        sessionCookieOptions(),
      );
      return response;
    } catch {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      loginUrl.searchParams.set("error", "Your session expired. Please sign in again.");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
  }

  if (session) {
    return NextResponse.next();
  }

  if (!isOAuthEnabled(config) && config.devBypass) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
