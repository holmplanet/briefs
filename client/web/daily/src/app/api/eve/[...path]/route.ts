import { getSession, loadAuthConfig } from "@/lib/auth";

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: Request, context: RouteContext): Promise<Response> {
  const config = loadAuthConfig();
  const session = await getSession(config);
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { path } = await context.params;
  const eveBase = (process.env.BRIEFS_EVE_URL ?? "http://localhost:2000").replace(/\/$/, "");
  const upstreamUrl = `${eveBase}/eve/v1/${path.map(encodeURIComponent).join("/")}${new URL(request.url).search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (session.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
  });

  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) responseHeaders.set("Content-Type", upstreamContentType);
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export async function GET(request: Request, context: RouteContext) {
  return forward(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return forward(request, context);
}
