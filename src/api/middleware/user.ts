import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import type { BriefEnv } from "../../config.js";
import { BriefMcpTokenVerifier } from "../../auth/mcp/verifier.js";
import { isApiError } from "../errors.js";

const USER_HEADER = "x-brief-user-id";

export type AuthedRequest = Request & {
  briefUserId: string;
};

export function createApiUserMiddleware(config: BriefEnv) {
  const verifier = new BriefMcpTokenVerifier(config.mcpAuth);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authed = req as AuthedRequest;

      if (config.mcpAuth.enabled) {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
          res.status(401).json({ error: "Bearer token required" });
          return;
        }

        const authInfo = await verifier.verifyAccessToken(header.slice("Bearer ".length));
        const userId = authInfo.extra?.userId;
        if (typeof userId !== "string" || userId.length === 0) {
          res.status(401).json({ error: "Token is missing user identity" });
          return;
        }

        authed.briefUserId = userId;
        next();
        return;
      }

      const requestedUserId = req.header(USER_HEADER);
      authed.briefUserId = requestedUserId?.trim() || process.env.BRIEF_DEFAULT_USER_ID || "default";
      next();
    } catch (error) {
      res.status(401).json({
        error: error instanceof Error ? error.message : "Authentication failed",
      });
    }
  };
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
