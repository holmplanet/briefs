import { getSystemRuntime } from "@briefs/system/runtime";
import { handleWebOAuthRequest } from "@briefs/system/web-oauth";

export const runtime = "nodejs";

async function handle(request: Request): Promise<Response> {
  const runtime = await getSystemRuntime();
  return runtime.betterAuth
    ? runtime.betterAuth.handler(request)
    : handleWebOAuthRequest(request, runtime);
}

export const GET = handle;
export const POST = handle;
