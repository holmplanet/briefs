import { Router } from "express";

import { ItemStatus, createItemInputSchema, updateItemInputSchema } from "@briefs/shared/item";

import type { ItemService } from "../../item/service.js";
import { ApiError } from "../errors.js";
import type { AuthedRequest } from "../middleware.js";

export function createItemRouter(service: ItemService): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const userId = (req as AuthedRequest).userId;
      const statusParam = req.query.status;
      const status =
        typeof statusParam === "string" && statusParam.length > 0
          ? (statusParam as (typeof ItemStatus)[keyof typeof ItemStatus])
          : undefined;

      if (status && !Object.values(ItemStatus).includes(status)) {
        throw new ApiError(400, `Invalid status: ${statusParam}`);
      }

      const items = await service.list(userId, status);
      res.json({ items });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const userId = (req as AuthedRequest).userId;
      const body = createItemInputSchema.parse(req.body);
      const item = await service.create(userId, body);
      res.status(201).json({ item });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:itemId", async (req, res, next) => {
    try {
      const userId = (req as unknown as AuthedRequest).userId;
      const body = updateItemInputSchema.parse(req.body);
      const item = await service.update(userId, req.params.itemId, body);
      res.json({ item });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:itemId/activities", async (req, res, next) => {
    try {
      const userId = (req as unknown as AuthedRequest).userId;
      const activities = await service.listActivities(userId, req.params.itemId);
      res.json({ activities });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
