import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerItemsCreateTool } from "./items-create.js";
import { registerItemsGetTool } from "./items-get.js";
import { registerItemsListActivitiesTool } from "./items-list-activities.js";
import { registerItemsListTool } from "./items-list.js";
import { registerItemsUpdateTool } from "./items-update.js";
import type { BriefsToolDeps, BriefsToolsConfig } from "./types.js";

export function registerBriefsTools(
  server: McpServer,
  deps: BriefsToolDeps,
  config: BriefsToolsConfig = {},
): void {
  registerItemsListTool(server, deps, config);
  registerItemsGetTool(server, deps, config);
  registerItemsCreateTool(server, deps, config);
  registerItemsUpdateTool(server, deps, config);
  registerItemsListActivitiesTool(server, deps, config);
}

export type { BriefsMcpAuth, BriefsToolDeps, BriefsToolsConfig } from "./types.js";
