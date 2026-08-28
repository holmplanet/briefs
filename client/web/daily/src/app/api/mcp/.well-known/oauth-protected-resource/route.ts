import { NextResponse } from "next/server";

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const resource = process.env.NEXT_PUBLIC_MCP_URL ?? `${origin}/api/mcp`;
  return NextResponse.json({
    resource,
    authorization_servers: [process.env.OAUTH_ISSUER ?? `${origin}/oauth`],
    scopes_supported: ["openid", "email", "profile", "offline_access"],
    bearer_methods_supported: ["header"],
  });
}
