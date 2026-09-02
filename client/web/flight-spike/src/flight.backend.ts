import Router from "@koa/router";

const router = new Router({ prefix: "/api/flight" });

router.get("/health", (context) => {
  context.body = { status: "ok", service: "briefs-flight-spike" };
});

export default router.routes();
