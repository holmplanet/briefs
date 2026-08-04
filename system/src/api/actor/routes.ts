import { Router } from "express";

import type { ActorService } from "../../actor/service.js";
import { ApiError } from "../errors.js";
import type { AuthedRequest } from "../middleware.js";

export function createActorRouter(service: ActorService): Router {
  const router = Router();

  router.get("/me", async (req, res, next) => {
    try {
      const userId = (req as AuthedRequest).userId;
      const actor = await service.ensurePerson(userId);
      res.json({ actor });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:actorId", async (req, res, next) => {
    try {
      const actor = await service.get(req.params.actorId);
      if (!actor) {
        throw new ApiError(404, `Actor not found: ${req.params.actorId}`);
      }
      res.json({ actor });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
