import { getSystemRuntime } from "@briefs/system/runtime";
import { handleWebOAuthRequest } from "@briefs/system/web-oauth";

export const runtime = "nodejs";

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  url.pathname = "/oauth/register";
  return handleWebOAuthRequest(new Request(url, request), await getSystemRuntime());
}

export const GET = () => Response.json({ error: "method_not_allowed" }, { status: 405 });
export const POST = handle;
