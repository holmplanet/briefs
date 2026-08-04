import { Router } from "express";
import { z } from "zod";

import { TaskPriority, TaskStatus } from "../../graph/tasks/protocol.js";
import {
  createBriefTask,
  listBriefTasks,
  updateBriefTask,
} from "../../tasks/service.js";
import { ApiError } from "../errors.js";
import type { AuthedRequest } from "../middleware/user.js";

const createTaskBody = z.object({
  label: z.string().min(1),
  status: z.nativeEnum(TaskStatus).optional(),
  dueAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  description: z.string().optional(),
});

const updateTaskBody = z.object({
  label: z.string().min(1).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  priority: z.nativeEnum(TaskPriority).nullable().optional(),
  description: z.string().nullable().optional(),
});

export function createTasksRouter(): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const userId = (req as unknown as AuthedRequest).briefUserId;
      const statusParam = req.query.status;
      const status =
        typeof statusParam === "string" && statusParam.length > 0
          ? (statusParam as TaskStatus)
          : undefined;

      if (status && !Object.values(TaskStatus).includes(status)) {
        throw new ApiError(400, `Invalid status: ${statusParam}`);
      }

      const tasks = await listBriefTasks(userId, status);
      res.json({ tasks });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const userId = (req as unknown as AuthedRequest).briefUserId;
      const body = createTaskBody.parse(req.body);
      const task = await createBriefTask({
        userId,
        ...body,
      });
      res.status(201).json({ task });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:taskId", async (req, res, next) => {
    try {
      const userId = (req as unknown as AuthedRequest).briefUserId;
      const body = updateTaskBody.parse(req.body);
      const task = await updateBriefTask(userId, req.params.taskId, body);
      res.json({ task });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
