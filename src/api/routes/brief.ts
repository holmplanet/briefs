import { Router } from "express";
import { z } from "zod";

import { BriefKind } from "../../briefs/generator.js";
import { generateBrief } from "../../mcp/brief-service.js";
import type { AuthedRequest } from "../middleware/user.js";

const briefQuery = z.object({
  kind: z.nativeEnum(BriefKind).default(BriefKind.ON_DEMAND),
  syncFirst: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value !== "false"),
});

export function createBriefRouter(): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const userId = (req as AuthedRequest).briefUserId;
      const query = briefQuery.parse(req.query);
      const brief = await generateBrief(userId, query.kind, {
        syncFirst: query.syncFirst,
      });
      res.json({ brief });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
