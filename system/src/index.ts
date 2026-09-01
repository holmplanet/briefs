import "dotenv/config";

import { fileURLToPath } from "node:url";

import express, { type Express, type Request, type Response } from "express";

import { mountApiRoutes } from "./api/router.js";
import { createOAuthRouter } from "./auth/oauth.js";
import { createBetterAuthCompatibilityHandler } from "./auth/better-auth-express.js";
import { createBetterAuthResourceMiddleware } from "./auth/better-auth-middleware.js";
import { bootstrap, type AppContext } from "./bootstrap.js";
import { closePool, createPool } from "./db.js";

export type { AppContext } from "./bootstrap.js";
export { bootstrap };

export function createApp(context: AppContext): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "holmplanet-briefs",
      storage: context.config.databaseUrl ? "postgres" : "memory",
    });
  });

  if (context.betterAuth) {
    const betterAuthHandler = createBetterAuthCompatibilityHandler(context.betterAuth, {
      allowedRedirectUris: [...context.config.oauthRedirectUris, ...context.config.oauthAllowedRedirectUris],
    });
    app.use((request, response, next) => {
      if (request.path.startsWith("/oauth")) {
        void betterAuthHandler(request, response, next);
        return;
      }
      next();
    });
  } else {
    app.use("/oauth", createOAuthRouter(context.config, context.auth, context.mailer));
  }

  mountApiRoutes(app, {
    items: context.items,
    actors: context.actors,
    briefs: context.briefs,
    authMiddleware: context.betterAuth
      ? createBetterAuthResourceMiddleware({
        issuer: context.config.oauthIssuer,
        audience: context.config.apiResource,
      })
      : undefined,
  });

  return app;
}

export async function startServer(): Promise<Express> {
  const context = await bootstrap();
  const app = createApp(context);

  app.listen(context.config.port, context.config.host, () => {
    console.log(`Briefs API listening on http://${context.config.host}:${context.config.port}`);
    console.log(`Health: http://localhost:${context.config.port}/health`);
    console.log(`Items: http://localhost:${context.config.port}/api/v1/items`);
    console.log(`Actors: http://localhost:${context.config.port}/api/v1/actors/me`);
    console.log(`Storage: ${context.config.databaseUrl ? "postgres" : "memory"}`);
  });

  return app;
}

export async function shutdown(context: AppContext): Promise<void> {
  if (context.config.databaseUrl) {
    const pool = createPool(context.config.databaseUrl);
    await closePool(pool);
  }
}

const entrypoint = fileURLToPath(import.meta.url);
if (process.argv[1] === entrypoint) {
  startServer().catch((error) => {
    console.error("Failed to start Briefs:", error);
    process.exit(1);
  });
}
