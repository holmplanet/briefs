import Router from "@koa/router";
import { decodeBriefsSession } from "@briefs/shared/session";

const router = new Router({ prefix: "/api/flight" });

const SESSION_COOKIE = "briefs_daily_session";
type FlightContext = Parameters<Parameters<typeof router.get>[1]>[0];

function cookieValue(header: string | undefined, name: string): string | undefined {
  return header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function sessionFromRequest(context: Parameters<Parameters<typeof router.get>[1]>[0]) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return decodeBriefsSession(cookieValue(context.request.headers.cookie, SESSION_COOKIE), secret);
}

async function apiRequest(context: FlightContext, path: string, init?: RequestInit) {
  const session = await sessionFromRequest(context);
  if (!session?.accessToken) return null;

  const apiUrl = (process.env.API_URL ?? "http://localhost:8001").replace(/\/$/, "");
  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${session.accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
}

router.get("/health", (context) => {
  context.body = { status: "ok", service: "briefs-flight-spike" };
});

router.get("/items", async (context) => {
  const response = await apiRequest(context, `/api/v1/items${typeof context.query.status === "string" ? `?status=${encodeURIComponent(context.query.status)}` : ""}`);
  if (!response) {
    context.status = 401;
    context.body = { error: "unauthorized", error_description: "Valid Briefs session required" };
    return;
  }
  context.status = response.status;
  context.body = await response.json();
});

router.get("/items/:itemId", async (context) => {
  const response = await apiRequest(context, `/api/v1/items/${encodeURIComponent(context.params.itemId)}`);
  if (!response) {
    context.status = 401;
    context.body = { error: "unauthorized", error_description: "Valid Briefs session required" };
    return;
  }
  context.status = response.status;
  context.body = await response.json();
});

router.get("/items/:itemId/activities", async (context) => {
  const response = await apiRequest(context, `/api/v1/items/${encodeURIComponent(context.params.itemId)}/activities`);
  if (!response) {
    context.status = 401;
    context.body = { error: "unauthorized", error_description: "Valid Briefs session required" };
    return;
  }
  context.status = response.status;
  context.body = await response.json();
});

router.post("/items", async (context) => {
  const body = (context.request as typeof context.request & { body?: unknown }).body;
  const response = await apiRequest(context, "/api/v1/items", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!response) {
    context.status = 401;
    context.body = { error: "unauthorized", error_description: "Valid Briefs session required" };
    return;
  }
  context.status = response.status;
  context.body = await response.json();
});

export default router.routes();
