import { Router } from "express";

import type { ActorService } from "../actor/service.js";
import type { ItemService } from "../item/service.js";
import { createActorRouter } from "./actor/routes.js";
import { createItemRouter } from "./item/routes.js";
import { createBriefRouter } from "./brief/routes.js";
import { apiErrorHandler, userMiddleware } from "./middleware.js";

export type ApiServices = {
  items: ItemService;
  actors: ActorService;
  briefs: import("../brief/service.js").BriefService;
};

export function mountApiRoutes(app: Router, services: ApiServices): void {
  const api = Router();
  api.use(userMiddleware);
  api.use("/actors", createActorRouter(services.actors));
  api.use("/items", createItemRouter(services.items));
  api.use("/briefs", createBriefRouter(services.briefs));
  app.use("/api/v1", api);
  app.use(apiErrorHandler);
}
