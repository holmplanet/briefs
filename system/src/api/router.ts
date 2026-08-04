import { Router } from "express";

import type { BriefService } from "../brief/service.js";
import type { StitchService } from "../stitch/service.js";
import { createBriefGenerateRouter } from "./brief/generate-routes.js";
import { createBriefsRouter } from "./brief/routes.js";
import { apiErrorHandler, userMiddleware } from "./middleware.js";
import { createStitchRouter } from "./stitch/routes.js";

export type ApiServices = {
  stitches: StitchService;
  briefs: BriefService;
};

export function mountApiRoutes(app: Router, services: ApiServices): void {
  const api = Router();
  api.use(userMiddleware);
  api.use("/stitches", createStitchRouter(services.stitches));
  api.use("/briefs", createBriefsRouter(services.briefs));
  api.use("/brief", createBriefGenerateRouter(services.briefs));
  app.use("/api/v1", api);
  app.use(apiErrorHandler);
}
