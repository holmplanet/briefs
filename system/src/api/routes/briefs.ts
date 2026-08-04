import { Router } from "express";

import type { PersonalBriefService } from "../../personal/brief-service.js";
import { ApiError } from "../errors.js";
import type { AuthedRequest } from "../middleware.js";

export function createBriefsRouter(service: PersonalBriefService): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const userId = (req as AuthedRequest).userId;
      const limitParam = req.query.limit;
      const limit =
        typeof limitParam === "string" && limitParam.length > 0
          ? Number(limitParam)
          : undefined;

      if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
        throw new ApiError(400, `Invalid limit: ${limitParam}`);
      }

      const briefs = await service.list(userId, limit);
      res.json({ briefs });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:briefId", async (req, res, next) => {
    try {
      const userId = (req as unknown as AuthedRequest).userId;
      const brief = await service.get(userId, req.params.briefId);
      res.json({ brief });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
