import Router from "@koa/router";
import { decodeBriefsSession } from "@briefs/shared/session";

const router = new Router({ prefix: "/api/flight" });

const SESSION_COOKIE = "briefs_daily_session";

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

router.get("/health", (context) => {
  context.body = { status: "ok", service: "briefs-flight-spike" };
});

router.get("/items", async (context) => {
  const session = await sessionFromRequest(context);
  if (!session) {
    context.status = 401;
    context.body = { error: "unauthorized", error_description: "Valid Briefs session required" };
    return;
  }

  if (!session.accessToken) {
    context.status = 401;
    context.body = { error: "unauthorized", error_description: "Briefs access token required" };
    return;
  }

  const apiUrl = (process.env.API_URL ?? "http://localhost:8001").replace(/\/$/, "");
  const status = typeof context.query.status === "string" ? `?status=${encodeURIComponent(context.query.status)}` : "";
  const response = await fetch(`${apiUrl}/api/v1/items${status}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  context.status = response.status;
  context.body = await response.json();
});

export default router.routes();
