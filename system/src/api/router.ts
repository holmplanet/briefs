import { Router } from "express";

import type { PersonalBriefService } from "../personal/brief-service.js";
import type { PersonalStitchService } from "../personal/service.js";
import { apiErrorHandler, userMiddleware } from "./middleware.js";
import { createBriefGenerateRouter } from "./routes/brief-generate.js";
import { createBriefsRouter } from "./routes/briefs.js";
import { createStitchesRouter } from "./routes/stitches.js";

export type ApiServices = {
  stitches: PersonalStitchService;
  briefs: PersonalBriefService;
};

export function mountApiRoutes(app: Router, services: ApiServices): void {
  const api = Router();
  api.use(userMiddleware);
  api.use("/stitches", createStitchesRouter(services.stitches));
  api.use("/briefs", createBriefsRouter(services.briefs));
  api.use("/brief", createBriefGenerateRouter(services.briefs));
  app.use("/api/v1", api);
  app.use(apiErrorHandler);
}
