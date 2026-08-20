import { getSystemRuntime } from "@briefs/system/runtime";
import { handleWebOAuthRequest } from "@briefs/system/web-oauth";

/** Keep same-deployment OAuth calls inside Next so Vercel Protection is not crossed. */
export async function getInProcessOAuthFetch(): Promise<typeof fetch> {
  const runtime = await getSystemRuntime();
  return async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    return handleWebOAuthRequest(new Request(url, init), runtime);
  };
}
