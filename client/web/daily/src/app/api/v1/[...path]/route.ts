import { getSystemRuntime } from "@briefs/system/runtime";
import { handleWebApiRequest } from "@briefs/system/web";

export const runtime = "nodejs";

async function handle(request: Request): Promise<Response> {
  return handleWebApiRequest(request, await getSystemRuntime());
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
