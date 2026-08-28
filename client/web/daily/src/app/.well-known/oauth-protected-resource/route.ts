import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET(request: Request): Response {
  const url = new URL(request.url);
  const issuer = (process.env.OAUTH_ISSUER ?? new URL("/oauth", url).toString()).replace(/\/$/, "");

  return NextResponse.json({
    resource: new URL("/mcp", url).toString(),
    authorization_servers: [issuer],
    scopes_supported: ["openid", "email", "profile", "offline_access"],
  });
}
