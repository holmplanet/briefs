import { Router } from "express";

import { generateBriefInputSchema } from "@briefs/shared";

import type { PersonalBriefService } from "../../personal/brief-service.js";
import type { AuthedRequest } from "../middleware.js";

export function createBriefGenerateRouter(service: PersonalBriefService): Router {
  const router = Router();

  router.post("/generate", async (req, res, next) => {
    try {
      const userId = (req as AuthedRequest).userId;
      const body = generateBriefInputSchema.parse(req.body ?? {});
      const brief = await service.generate(userId, body);
      res.status(201).json({ brief });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
