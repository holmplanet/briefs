import type { Express, Request, Response } from "express";

import type { BriefEnv } from "../../config.js";
import { createMcpApiToken } from "./factory.js";
import { getMcpApiTokenStore } from "./runtime.js";

function readAdminSecret(req: Request, config: BriefEnv): string | undefined {
  const header = req.header("x-brief-admin-secret");
  if (header) {
    return header;
  }

  const auth = req.header("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length);
  }

  return config.mcpAuth.adminSecret;
}

export function mountMcpAuthRoutes(app: Express, config: BriefEnv): void {
  if (!config.mcpAuth.adminSecret) {
    return;
  }

  app.post("/auth/tokens", async (req: Request, res: Response) => {
    const provided = readAdminSecret(req, config);
    if (!provided || provided !== config.mcpAuth.adminSecret) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = typeof req.body?.userId === "string" ? req.body.userId : "";
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const created = await createMcpApiToken(getMcpApiTokenStore(), {
      userId,
      label: typeof req.body?.label === "string" ? req.body.label : undefined,
      expiresAt: typeof req.body?.expiresAt === "string" ? req.body.expiresAt : undefined,
    });

    res.status(201).json({
      id: created.id,
      userId: created.userId,
      label: created.label,
      token: created.token,
      createdAt: created.createdAt,
      expiresAt: created.expiresAt,
    });
  });
}
