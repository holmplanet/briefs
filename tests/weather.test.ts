import { describe, expect, it } from "vitest";

import { NodeKind } from "../src/graph/models.js";
import {
  buildWeatherPayload,
  linkEventsToWeather,
  parseOpenMeteoHourly,
} from "../src/connectors/personal/weather/map-forecast.js";
import { WeatherClient } from "../src/connectors/personal/weather/client.js";
import type { WeatherConfig } from "../src/config.js";
import { analyzeGraph } from "../src/reasoning/analyze.js";
import { EdgeKind } from "../src/graph/models.js";

const weatherConfig: WeatherConfig = {
  provider: "open-meteo",
  latitude: 35.7796,
  longitude: -78.6382,
  lookaheadDays: 2,
  precipitationAlertThreshold: 50,
};

describe("weather connector", () => {
  it("parses severe hourly periods from Open-Meteo", () => {
    const periods = parseOpenMeteoHourly(
      {
        time: ["2026-08-01T18:00", "2026-08-01T19:00"],
        precipitation_probability: [10, 80],
        weathercode: [1, 95],
      },
      50,
    );

    expect(periods).toHaveLength(1);
    expect(periods[0]?.summary).toBe("Thunderstorm");
  });

  it("links overlapping events to weather via depends_on", () => {
    const periods = parseOpenMeteoHourly(
      {
        time: ["2026-08-01T18:00"],
        precipitation_probability: [80],
        weathercode: [95],
      },
      50,
    );

    const snapshot = {
      userId: "user-1",
      syncedAt: new Date().toISOString(),
      nodes: [
        {
          id: "event-1",
          userId: "user-1",
          kind: NodeKind.EVENT,
          label: "Afternoon meeting",
          data: { externalId: "event-1", connector: "google-calendar" },
          startsAt: "2026-08-01T18:15:00.000Z",
          endsAt: "2026-08-01T19:00:00.000Z",
          updatedAt: new Date().toISOString(),
        },
      ],
      edges: [],
    };

    const edges = linkEventsToWeather(snapshot, periods);
    expect(edges).toHaveLength(1);
    expect(edges[0]?.kind).toBe(EdgeKind.DEPENDS_ON);
  });

  it("fetches forecast with mocked Open-Meteo API", async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          hourly: {
            time: ["2026-08-01T18:00"],
            precipitation_probability: [70],
            weathercode: [65],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );

    const client = new WeatherClient({
      config: weatherConfig,
      snapshot: { userId: "user-1", nodes: [], edges: [], syncedAt: new Date().toISOString() },
      fetchImpl,
    });

    const payload = await client.fetchForecast();
    expect(payload.nodes).toHaveLength(1);
    expect(payload.nodes[0]?.kind).toBe(NodeKind.WEATHER);
  });

  it("surfaces weather conflicts in reasoning", () => {
    const payload = buildWeatherPayload(
      {
        userId: "user-1",
        syncedAt: new Date().toISOString(),
        nodes: [
          {
            id: "event-1",
            userId: "user-1",
            kind: NodeKind.EVENT,
            label: "Client call",
            data: { externalId: "event-1" },
            startsAt: "2026-08-01T18:15:00.000Z",
            endsAt: "2026-08-01T19:00:00.000Z",
            updatedAt: new Date().toISOString(),
          },
        ],
        edges: [],
      },
      parseOpenMeteoHourly(
        {
          time: ["2026-08-01T18:00"],
          precipitation_probability: [80],
          weathercode: [95],
        },
        50,
      ),
    );

    const snapshot = {
      userId: "user-1",
      syncedAt: new Date().toISOString(),
      nodes: [
        {
          id: "event-1",
          userId: "user-1",
          kind: NodeKind.EVENT,
          label: "Client call",
          data: { externalId: "event-1" },
          startsAt: "2026-08-01T18:15:00.000Z",
          endsAt: "2026-08-01T19:00:00.000Z",
          updatedAt: new Date().toISOString(),
        },
        {
          id: "wx-1",
          userId: "user-1",
          kind: NodeKind.WEATHER,
          label: "Thunderstorm (80% precip)",
          data: {
            externalId: payload.nodes[0]?.externalId,
            precipitationProbability: 80,
            summary: "Thunderstorm",
          },
          startsAt: payload.nodes[0]?.startsAt,
          endsAt: payload.nodes[0]?.endsAt,
          updatedAt: new Date().toISOString(),
        },
      ],
      edges: [
        {
          id: "edge-1",
          userId: "user-1",
          kind: EdgeKind.DEPENDS_ON,
          sourceId: "event-1",
          targetId: "wx-1",
          data: {},
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    const changes = analyzeGraph(snapshot);
    expect(changes.insights[0]?.message).toContain("Client call");
    expect(changes.insights[0]?.message).toContain("weather");
  });
});
