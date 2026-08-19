import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createBriefsMcpServer } from "@briefs/mcp/server";
import { verifyAccessToken } from "@briefs/shared/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const user = await resolveAuth(request);
  if (!user) return Response.json({ error: "unauthorized", error_description: "Bearer token required" }, { status: 401 });

  const server = createBriefsMcpServer(user, process.env.BRIEFS_API_URL ?? new URL(request.url).origin);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Stateless MCP endpoint requires POST" }, { status: 405 });
}

export async function DELETE(): Promise<Response> {
  return new Response(null, { status: 204 });
}

async function resolveAuth(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const devSkipAuth = process.env.BRIEFS_MCP_DEV_SKIP_AUTH !== "false" && (process.env.BRIEFS_ENV ?? "development") !== "production";
  if (!token && devSkipAuth) {
    return { userId: process.env.BRIEFS_DEV_USER_ID ?? "demo", email: "dev@localhost", token: "dev-token" };
  }
  if (!token) return null;
  const issuer = (process.env.BRIEFS_OAUTH_ISSUER ?? "http://localhost:8001/oauth").replace(/\/$/, "");
  const claims = await verifyAccessToken(token, process.env.BRIEFS_AUTH_SECRET ?? "dev-briefs-auth-secret", issuer);
  return claims ? { userId: claims.sub, email: claims.email, token } : null;
}
