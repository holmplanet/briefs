import type { NormalizedEdgeInput, NormalizedNodeInput, NormalizedSyncPayload } from "../../src/connectors/types.js";
import { EdgeKind, NodeKind, type GraphNode, type GraphSnapshot } from "../../src/graph/models.js";

type WeatherForecastPeriod = {
  externalId: string;
  startsAt: string;
  endsAt: string;
  precipitationProbability: number;
  weatherCode: number;
  summary: string;
  severe: boolean;
};

function parseOpenMeteoTime(value: string): Date {
  const hasTimezone = value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

function decodeWeatherCode(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Weather";
}

export function parseOpenMeteoHourly(
  hourly: {
    time: string[];
    precipitation_probability?: Array<number | null>;
    weathercode?: Array<number | null>;
  },
  precipitationAlertThreshold: number,
): WeatherForecastPeriod[] {
  const periods: WeatherForecastPeriod[] = [];
  const severeCodes = new Set([55, 56, 57, 65, 66, 67, 71, 73, 75, 77, 82, 85, 86, 95, 96, 99]);

  for (let index = 0; index < hourly.time.length; index += 1) {
    const startsAt = hourly.time[index];
    if (!startsAt) continue;

    const precipitationProbability = hourly.precipitation_probability?.[index] ?? 0;
    const weatherCode = hourly.weathercode?.[index] ?? 0;
    const severe =
      precipitationProbability >= precipitationAlertThreshold || severeCodes.has(weatherCode);

    if (!severe) continue;

    const end = parseOpenMeteoTime(startsAt);
    end.setUTCHours(end.getUTCHours() + 1);

    periods.push({
      externalId: `wx-${startsAt}`,
      startsAt: parseOpenMeteoTime(startsAt).toISOString(),
      endsAt: end.toISOString(),
      precipitationProbability,
      weatherCode,
      summary: decodeWeatherCode(weatherCode),
      severe,
    });
  }

  return periods;
}

function weatherPeriodToNode(period: WeatherForecastPeriod): NormalizedNodeInput {
  return {
    externalId: period.externalId,
    kind: NodeKind.WEATHER,
    label: `${period.summary} (${period.precipitationProbability}% precip)`,
    startsAt: period.startsAt,
    endsAt: period.endsAt,
    data: {
      source: "smoke-fixture",
      precipitationProbability: period.precipitationProbability,
      weatherCode: period.weatherCode,
      severe: period.severe,
    },
  };
}

function eventWindow(node: GraphNode): { start: number; end: number } | undefined {
  if (!node.startsAt) return undefined;
  const start = Date.parse(node.startsAt);
  const end = node.endsAt ? Date.parse(node.endsAt) : start + 60 * 60 * 1000;
  if (Number.isNaN(start) || Number.isNaN(end)) return undefined;
  return { start, end };
}

function linkEventsToWeather(
  snapshot: GraphSnapshot,
  periods: WeatherForecastPeriod[],
): NormalizedEdgeInput[] {
  const edges: NormalizedEdgeInput[] = [];
  const events = snapshot.nodes.filter((node) => node.kind === NodeKind.EVENT);

  for (const event of events) {
    const window = eventWindow(event);
    if (!window) continue;

    const externalEventId = String(event.data.externalId ?? event.id);

    for (const period of periods) {
      const weatherStart = Date.parse(period.startsAt);
      const weatherEnd = Date.parse(period.endsAt);
      if (window.start >= weatherEnd || window.end <= weatherStart) continue;

      edges.push({
        externalId: `dep-${externalEventId}-${period.externalId}`,
        kind: EdgeKind.DEPENDS_ON,
        sourceExternalId: externalEventId,
        targetExternalId: period.externalId,
        data: { reason: "event_overlaps_weather_window" },
      });
    }
  }

  return edges;
}

export function buildWeatherPayload(
  snapshot: GraphSnapshot,
  periods: WeatherForecastPeriod[],
): NormalizedSyncPayload {
  return {
    nodes: periods.map(weatherPeriodToNode),
    edges: linkEventsToWeather(snapshot, periods),
  };
}
