import { ZodError } from "zod";

import { verifyAccessToken } from "@briefs/shared/auth";
import { ItemStatus, itemCreateInputSchema, itemUpdateInputSchema } from "@briefs/shared/item";

import type { AppContext } from "./bootstrap.js";
import { isApiError } from "./api/errors.js";

const USER_HEADER = "x-briefs-user-id";

export async function authenticateWebRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const issuer = process.env.OAUTH_ISSUER ?? `http://localhost:${process.env.APP_PORT ?? "8001"}/oauth`;
  const secret = process.env.AUTH_SECRET ?? "dev-briefs-auth-secret";
  const claims = bearer ? await verifyAccessToken(bearer, secret, issuer.replace(/\/$/, "")) : null;
  if (claims) return claims.sub;

  const devBypass = process.env.API_DEV_BYPASS !== "false" && (process.env.APP_ENV ?? "development") !== "production";
  if (!devBypass) return null;
  return request.headers.get(USER_HEADER)?.trim() || process.env.DEFAULT_USER_ID || "default";
}

export async function handleWebApiRequest(request: Request, context: AppContext): Promise<Response> {
  const userId = await authenticateWebRequest(request);
  if (!userId) return json({ error: "unauthorized", error_description: "Valid bearer token required" }, 401);

  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean).slice(2);
  try {
    if (segments[0] === "items") return handleItems(request, context, userId, segments.slice(1), url.searchParams);
    if (segments[0] === "actors" && segments[1] === "me" && request.method === "GET") {
      return json({ actor: await context.actors.ensurePerson(userId) });
    }
    return json({ error: "Not found" }, 404);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

async function handleItems(
  request: Request,
  context: AppContext,
  userId: string,
  segments: string[],
  searchParams: URLSearchParams,
): Promise<Response> {
  const itemId = segments[0];
  if (!itemId && request.method === "GET") {
    const rawStatus = searchParams.get("status");
    const status = rawStatus ? rawStatus as (typeof ItemStatus)[keyof typeof ItemStatus] : undefined;
    if (status && !Object.values(ItemStatus).includes(status)) return json({ error: `Invalid status: ${rawStatus}` }, 400);
    return json({ items: await context.items.list(userId, status) });
  }
  if (!itemId && request.method === "POST") {
    const item = await context.items.create(userId, itemCreateInputSchema.parse(await request.json()));
    return json({ item }, 201);
  }
  if (!itemId) return json({ error: "Not found" }, 404);
  if (segments[1] === "activities" && request.method === "GET") {
    return json({ activities: await context.items.listActivities(userId, itemId) });
  }
  if (request.method === "GET") {
    const item = await context.items.get(userId, itemId);
    return item ? json({ item }) : json({ error: `Item not found: ${itemId}` }, 404);
  }
  if (request.method === "PATCH") {
    const item = await context.items.update(userId, itemId, itemUpdateInputSchema.parse(await request.json()));
    return json({ item });
  }
  return json({ error: "Method not allowed" }, 405);
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function apiErrorResponse(error: unknown): Response {
  if (error instanceof ZodError) return json({ error: error.flatten() }, 400);
  if (isApiError(error)) return json({ error: error.message }, error.status);
  if (error instanceof Error && /not found/i.test(error.message)) return json({ error: error.message }, 404);
  console.error("API error:", error);
  return json({ error: "Internal server error" }, 500);
}
