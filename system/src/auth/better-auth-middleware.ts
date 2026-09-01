import type { NextFunction, Request, Response } from "express";

import { verifyBetterAuthAccessToken, type BetterAuthAccessClaims } from "./better-auth-resource.js";

export type BetterAuthAuthedRequest = Request & {
  userId: string;
  betterAuthClaims: BetterAuthAccessClaims;
};

export type BetterAuthResourceMiddlewareOptions = {
  issuer: string;
  audience: string;
  jwksUrl?: string;
};

/** Creates an Express bearer-token boundary for a Better Auth resource. */
export function createBetterAuthResourceMiddleware(
  options: BetterAuthResourceMiddlewareOptions,
) {
  return async function betterAuthResourceMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const authHeader = req.header("authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const claims = await verifyBetterAuthAccessToken(bearer, options);

    if (!claims) {
      res.status(401).json({ error: "unauthorized", error_description: "Valid bearer token required" });
      return;
    }

    const authed = req as BetterAuthAuthedRequest;
    authed.userId = claims.sub;
    authed.betterAuthClaims = claims;
    next();
  };
}
