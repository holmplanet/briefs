import type { Express, Request, Response } from "express";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";

import type { BriefEnv } from "../config.js";
import { buildGoogleAuthUrl, decodeOAuthState, exchangeGoogleAuthCode } from "./google.js";
import { BriefMcpTokenVerifier } from "./mcp/verifier.js";
import { getOAuthTokenStore } from "./runtime.js";

function readAuthenticatedUserId(req: Request, config: BriefEnv): string {
  if (config.mcpAuth.enabled) {
    const userId = req.auth?.extra?.userId;
    return typeof userId === "string" ? userId : "";
  }

  return typeof req.query.userId === "string" ? req.query.userId : "";
}

export function mountGoogleAuthRoutes(app: Express, config: BriefEnv): void {
  const google = config.google;
  if (!google) {
    return;
  }

  const startGuards = config.mcpAuth.enabled
    ? [
        requireBearerAuth({
          verifier: new BriefMcpTokenVerifier(config.mcpAuth),
        }),
      ]
    : [];

  app.get("/auth/google/start", ...startGuards, (req: Request, res: Response) => {
    const userId = readAuthenticatedUserId(req, config);
    if (!userId) {
      res.status(config.mcpAuth.enabled ? 401 : 400).json({
        error: config.mcpAuth.enabled
          ? "Authenticated MCP token required"
          : "userId query parameter is required",
      });
      return;
    }

    res.redirect(buildGoogleAuthUrl(google, userId));
  });

  app.get("/auth/google/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";

    if (!code || !state) {
      res.status(400).json({ error: "Missing code or state" });
      return;
    }

    try {
      const { userId } = decodeOAuthState(state);
      const tokens = await exchangeGoogleAuthCode(google, code);
      await getOAuthTokenStore().save({ ...tokens, userId });
      res.status(200).json({
        ok: true,
        userId,
        provider: tokens.provider,
        scopes: tokens.scopes,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
