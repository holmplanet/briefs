import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { isApiError } from "./errors.js";
import { verifyAccessToken } from "@briefs/shared/auth";
import { isProductionEnvironment } from "../config.js";

const USER_HEADER = "x-briefs-user-id";

export type AuthedRequest = Request & {
  userId: string;
};

export async function userMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.header("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const issuer = process.env.OAUTH_ISSUER ?? `http://localhost:${process.env.APP_PORT ?? "8001"}/oauth`;
  const secret = process.env.AUTH_SECRET ?? "dev-briefs-auth-secret";
  const claims = bearer ? await verifyAccessToken(bearer, secret, issuer.replace(/\/$/, "")) : null;

  if (claims) {
    const authed = req as AuthedRequest;
    authed.userId = claims.sub;
    next();
    return;
  }

  const devBypass = process.env.API_DEV_BYPASS !== "false" && !isProductionEnvironment();
  if (!devBypass) {
    res.status(401).json({ error: "unauthorized", error_description: "Valid bearer token required" });
    return;
  }

  const authed = req as AuthedRequest;
  authed.userId = req.header(USER_HEADER)?.trim() || process.env.DEFAULT_USER_ID || "default";
  next();
}

export function apiErrorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({ error: error.flatten() });
    return;
  }

  if (isApiError(error)) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  if (error instanceof Error && /not found/i.test(error.message)) {
    res.status(404).json({ error: error.message });
    return;
  }

  console.error("API error:", error);
  res.status(500).json({ error: "Internal server error" });
}
