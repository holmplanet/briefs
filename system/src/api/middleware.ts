import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { isApiError } from "./errors.js";

const USER_HEADER = "x-briefs-user-id";

export type AuthedRequest = Request & {
  userId: string;
};

export function userMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authed = req as AuthedRequest;
  authed.userId = req.header(USER_HEADER)?.trim() || process.env.BRIEFS_DEFAULT_USER_ID || "default";
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
