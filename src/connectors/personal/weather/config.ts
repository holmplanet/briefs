export type WeatherConfig = {
  provider: "open-meteo";
  latitude: number;
  longitude: number;
  lookaheadDays: number;
  precipitationAlertThreshold: number;
};

function readCoordinate(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function loadWeatherConfig(): WeatherConfig | undefined {
  const latitude = readCoordinate(process.env.BRIEF_WEATHER_LATITUDE);
  const longitude = readCoordinate(process.env.BRIEF_WEATHER_LONGITUDE);
  if (latitude === undefined || longitude === undefined) {
    return undefined;
  }

  return {
    provider: "open-meteo",
    latitude,
    longitude,
    lookaheadDays: readPositiveInt(process.env.BRIEF_WEATHER_LOOKAHEAD_DAYS, 7),
    precipitationAlertThreshold: readPositiveInt(
      process.env.BRIEF_WEATHER_PRECIP_ALERT_THRESHOLD,
      50,
    ),
  };
}
