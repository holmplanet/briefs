import { Router } from "express";

import {
  TaskStatus,
  createTaskNodeInputSchema,
  updateTaskNodeInputSchema,
} from "@brief/shared";

import type { PersonalTaskService } from "../../personal/service.js";
import { ApiError } from "../errors.js";
import type { AuthedRequest } from "../middleware.js";

export function createTasksRouter(service: PersonalTaskService): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const userId = (req as AuthedRequest).userId;
      const statusParam = req.query.status;
      const status =
        typeof statusParam === "string" && statusParam.length > 0
          ? (statusParam as (typeof TaskStatus)[keyof typeof TaskStatus])
          : undefined;

      if (status && !Object.values(TaskStatus).includes(status)) {
        throw new ApiError(400, `Invalid status: ${statusParam}`);
      }

      const tasks = await service.list(userId, status);
      res.json({ tasks });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const userId = (req as AuthedRequest).userId;
      const body = createTaskNodeInputSchema.parse(req.body);
      const task = await service.create(userId, body);
      res.status(201).json({ task });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:taskId", async (req, res, next) => {
    try {
      const userId = (req as unknown as AuthedRequest).userId;
      const body = updateTaskNodeInputSchema.parse(req.body);
      const task = await service.update(userId, req.params.taskId, body);
      res.json({ task });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
