import type { WeatherConfig } from "../../../config.js";
import {
  type OpenMeteoResponse,
  buildWeatherPayload,
  parseOpenMeteoHourly,
} from "./map-forecast.js";
import type { GraphSnapshot } from "../../../graph/models.js";

export type WeatherClientOptions = {
  config: WeatherConfig;
  snapshot: GraphSnapshot;
  fetchImpl?: typeof fetch;
};

export class WeatherClient {
  constructor(private readonly options: WeatherClientOptions) {}

  async fetchForecast(): Promise<ReturnType<typeof buildWeatherPayload>> {
    const { config, snapshot } = this.options;
    const params = new URLSearchParams({
      latitude: String(config.latitude),
      longitude: String(config.longitude),
      hourly: "precipitation_probability,weathercode",
      forecast_days: String(config.lookaheadDays),
      timezone: "UTC",
    });

    const fetchImpl = this.options.fetchImpl ?? fetch;
    const response = await fetchImpl(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Open-Meteo API failed (${response.status}): ${detail.slice(0, 240)}`);
    }

    const payload = (await response.json()) as OpenMeteoResponse;
    if (!payload.hourly) {
      throw new Error("Open-Meteo response missing hourly forecast");
    }

    const periods = parseOpenMeteoHourly(payload.hourly, config.precipitationAlertThreshold);
    return buildWeatherPayload(snapshot, periods);
  }
}

export function createWeatherClient(
  config: WeatherConfig,
  snapshot: GraphSnapshot,
  fetchImpl?: typeof fetch,
): WeatherClient {
  return new WeatherClient({ config, snapshot, fetchImpl });
}
