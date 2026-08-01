import type { BriefEnv } from "../../config.js";
import type { ConnectorRegistry } from "../registry.js";
import { GoogleCalendarConnector } from "./google-calendar/connector.js";

export function registerPersonalConnectors(registry: ConnectorRegistry, config: BriefEnv): void {
  if (config.google) {
    registry.register(new GoogleCalendarConnector(config.google));
  }
}
