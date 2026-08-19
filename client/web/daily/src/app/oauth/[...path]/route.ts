import { getSystemRuntime } from "@briefs/system/runtime";
import { handleWebOAuthRequest } from "@briefs/system/web-oauth";

export const runtime = "nodejs";

async function handle(request: Request): Promise<Response> {
  return handleWebOAuthRequest(request, await getSystemRuntime());
}

export const GET = handle;
export const POST = handle;
