import type { BriefEnv } from "../../config.js";
import type { ConnectorRegistry } from "../registry.js";
import { BriefTasksConnector } from "./brief-tasks/connector.js";

export function registerPersonalConnectors(registry: ConnectorRegistry, _config: BriefEnv): void {
  registry.register(new BriefTasksConnector());
}
