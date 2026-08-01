import type { Express, Request, Response } from "express";

import type { BriefEnv } from "../config.js";
import { buildGoogleAuthUrl, decodeOAuthState, exchangeGoogleAuthCode } from "./google.js";
import { getOAuthTokenStore } from "./runtime.js";

export function mountGoogleAuthRoutes(app: Express, config: BriefEnv): void {
  const google = config.google;
  if (!google) {
    return;
  }

  app.get("/auth/google/start", (req: Request, res: Response) => {
    const userId = typeof req.query.userId === "string" ? req.query.userId : "";
    if (!userId) {
      res.status(400).json({ error: "userId query parameter is required" });
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
