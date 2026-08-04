import { Router } from "express";

import type { PersonalTaskService } from "../personal/service.js";
import { apiErrorHandler, userMiddleware } from "./middleware.js";
import { createTasksRouter } from "./routes/tasks.js";

export function mountApiRoutes(app: Router, service: PersonalTaskService): void {
  const api = Router();
  api.use(userMiddleware);
  api.use("/tasks", createTasksRouter(service));
  app.use("/api/v1", api);
  app.use(apiErrorHandler);
}
