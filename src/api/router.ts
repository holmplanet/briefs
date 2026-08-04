import { Router, type Express } from "express";

import type { BriefEnv } from "../config.js";
import { createApiUserMiddleware } from "./middleware/user.js";
import { createBriefRouter } from "./routes/brief.js";
import { createTasksRouter } from "./routes/tasks.js";

export function mountApiRoutes(app: Express, config: BriefEnv): void {
  const api = Router();
  const requireUser = createApiUserMiddleware(config);

  api.use(requireUser);
  api.use("/tasks", createTasksRouter());
  api.use("/brief", createBriefRouter());

  app.use("/api/v1", api);
}
