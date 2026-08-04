import { Router } from "express";

import {
  StitchStatus,
  createStitchInputSchema,
  updateStitchInputSchema,
} from "@briefs/shared";

import type { PersonalStitchService } from "../../personal/service.js";
import { ApiError } from "../errors.js";
import type { AuthedRequest } from "../middleware.js";

export function createStitchesRouter(service: PersonalStitchService): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const userId = (req as AuthedRequest).userId;
      const statusParam = req.query.status;
      const status =
        typeof statusParam === "string" && statusParam.length > 0
          ? (statusParam as (typeof StitchStatus)[keyof typeof StitchStatus])
          : undefined;

      if (status && !Object.values(StitchStatus).includes(status)) {
        throw new ApiError(400, `Invalid status: ${statusParam}`);
      }

      const stitches = await service.list(userId, status);
      res.json({ stitches });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const userId = (req as AuthedRequest).userId;
      const body = createStitchInputSchema.parse(req.body);
      const stitch = await service.create(userId, body);
      res.status(201).json({ stitch });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:stitchId", async (req, res, next) => {
    try {
      const userId = (req as unknown as AuthedRequest).userId;
      const body = updateStitchInputSchema.parse(req.body);
      const stitch = await service.update(userId, req.params.stitchId, body);
      res.json({ stitch });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
