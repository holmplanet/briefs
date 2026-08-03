import type { BriefEnv } from "../../config.js";
import type { ConnectorRegistry } from "../registry.js";
import { BriefTasksConnector } from "./brief-tasks/connector.js";
import { GoogleCalendarConnector } from "./google-calendar/connector.js";
import { WeatherConnector } from "./weather/connector.js";

export function registerPersonalConnectors(registry: ConnectorRegistry, config: BriefEnv): void {
  registry.register(new BriefTasksConnector());

  if (!config.legacyConnectors) {
    return;
  }

  if (config.google) {
    registry.register(new GoogleCalendarConnector(config.google));
  }
  if (config.weather) {
    registry.register(new WeatherConnector(config.weather));
  }
}
