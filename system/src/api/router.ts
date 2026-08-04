import { Router } from "express";

import type { PersonalStitchService } from "../personal/service.js";
import { apiErrorHandler, userMiddleware } from "./middleware.js";
import { createStitchesRouter } from "./routes/stitches.js";

export function mountApiRoutes(app: Router, service: PersonalStitchService): void {
  const api = Router();
  api.use(userMiddleware);
  api.use("/stitches", createStitchesRouter(service));
  app.use("/api/v1", api);
  app.use(apiErrorHandler);
}
