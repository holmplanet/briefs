import { NextResponse, type NextRequest } from "next/server";

import { loadAuthConfig, isOAuthEnabled } from "@/lib/auth/config";
import { SESSION_COOKIE, decodeSessionValue } from "@/lib/auth/session";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/logout", "/oauth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const config = loadAuthConfig();
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await decodeSessionValue(raw, config.sessionSecret);

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
