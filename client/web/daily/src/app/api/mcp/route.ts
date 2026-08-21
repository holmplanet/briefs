import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createBriefsMcpServer } from "@briefs/mcp/server";
import { verifyAccessToken } from "@briefs/shared/auth";
import { getSystemRuntime } from "@briefs/system/runtime";
import { handleWebApiRequest } from "@briefs/system/web";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const user = await resolveAuth(request);
  if (!user) {
    const resourceMetadata = new URL("/.well-known/oauth-protected-resource", request.url);
    return Response.json(
      { error: "unauthorized", error_description: "Bearer token required" },
      {
        status: 401,
        headers: { "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadata.toString()}"` },
      },
    );
  }

  const vercelCookie = request.headers.get("cookie");
  const systemRuntime = await getSystemRuntime();
  const internalFetch: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    return handleWebApiRequest(new Request(url, init), systemRuntime);
  };
  const server = createBriefsMcpServer(user, process.env.API_URL, {
    headers: vercelCookie ? { cookie: vercelCookie } : undefined,
    fetch: internalFetch,
  });
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
  const devSkipAuth = process.env.MCP_DEV_SKIP_AUTH !== "false" && process.env.NODE_ENV !== "production";
  if (!token && devSkipAuth) {
    return { userId: process.env.DEV_USER_ID ?? "demo", email: "dev@localhost", token: "dev-token" };
  }
  if (!token) return null;
  const issuer = (process.env.OAUTH_ISSUER ?? "http://localhost:8001/oauth").replace(/\/$/, "");
  const claims = await verifyAccessToken(token, process.env.AUTH_SECRET ?? "dev-briefs-auth-secret", issuer);
  return claims ? { userId: claims.sub, email: claims.email, token } : null;
}
