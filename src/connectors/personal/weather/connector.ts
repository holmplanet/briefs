import type { WeatherConfig } from "../../../config.js";
import { getGraphStore } from "../../../graph/runtime.js";
import { ReadOnlyConnector } from "../../base.js";
import { ConnectorPack, mapPayloadToGraph, type NormalizedSyncPayload } from "../../types.js";
import { createWeatherClient } from "./client.js";

export const WEATHER_CONNECTOR_NAME = "weather";

function resolveGraphExternalId(externalId: string): (node: {
  id: string;
  data: Record<string, unknown>;
}) => boolean {
  return (node) => String(node.data.externalId ?? node.id) === externalId;
}

export class WeatherConnector extends ReadOnlyConnector {
  readonly definition = {
    name: WEATHER_CONNECTOR_NAME,
    pack: ConnectorPack.PERSONAL,
    description: "Read weather forecasts and link them to calendar events",
    readOnly: true,
  };

  constructor(
    private readonly weatherConfig: WeatherConfig,
    private readonly createClient = createWeatherClient,
  ) {
    super();
  }

  async fetch(userId: string): Promise<NormalizedSyncPayload> {
    const snapshot = await getGraphStore().getSnapshot(userId);
    const client = this.createClient(this.weatherConfig, snapshot);
    return client.fetchForecast();
  }

  async sync(userId: string) {
    const snapshot = await getGraphStore().getSnapshot(userId);
    const payload = await this.fetch(userId);

    return mapPayloadToGraph(userId, this.definition.name, payload, {
      resolveExternalNodeId: (externalId) =>
        snapshot.nodes.find(resolveGraphExternalId(externalId))?.id,
    });
  }
}
