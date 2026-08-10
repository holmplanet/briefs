import { Router } from "express";

import { briefCreateInputSchema } from "@briefs/shared/brief";

import type { BriefService } from "../../brief/service.js";
import { ApiError } from "../errors.js";
import type { AuthedRequest } from "../middleware.js";

export function createBriefRouter(service: BriefService): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const userId = (req as unknown as AuthedRequest).userId;
      const rawLimit = typeof req.query.limit === "string" ? Number(req.query.limit) : 20;
      const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 100) : 20;
      res.json({ briefs: await service.list(userId, limit) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:briefId", async (req, res, next) => {
    try {
      const userId = (req as unknown as AuthedRequest).userId;
      const brief = await service.get(userId, req.params.briefId);
      if (!brief) throw new ApiError(404, `Brief not found: ${req.params.briefId}`);
      res.json({ brief });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const userId = (req as unknown as AuthedRequest).userId;
      const brief = await service.create(userId, briefCreateInputSchema.parse(req.body));
      res.status(201).json({ brief });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
