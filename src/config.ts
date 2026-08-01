import { GOOGLE_CALENDAR_READONLY_SCOPE } from "./auth/types.js";
import { loadWeatherConfig, type WeatherConfig } from "./connectors/personal/weather/config.js";

export const VERSION = "0.1.0";
export type { WeatherConfig };

export type GoogleConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  lookaheadDays: number;
};

export type BriefEnv = {
  env: string;
  host: string;
  port: number;
  publicUrl: string;
  mcpPath: string;
  databaseUrl?: string;
  redisUrl?: string;
  graphCacheTtlSeconds: number;
  google?: GoogleConfig;
  weather?: WeatherConfig;
};

function readPort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readTtl(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function loadGoogleConfig(publicUrl: string): GoogleConfig | undefined {
  const clientId = process.env.BRIEF_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.BRIEF_GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return undefined;
  }

  const redirectUri =
    process.env.BRIEF_GOOGLE_REDIRECT_URI ?? `${publicUrl}/auth/google/callback`;
  const scopes = (process.env.BRIEF_GOOGLE_SCOPES ?? GOOGLE_CALENDAR_READONLY_SCOPE)
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes,
    lookaheadDays: readPositiveInt(process.env.BRIEF_GOOGLE_CALENDAR_LOOKAHEAD_DAYS, 14),
  };
}

export function loadConfig(): BriefEnv {
  const host = process.env.BRIEF_HOST ?? "0.0.0.0";
  const port = readPort(process.env.BRIEF_PORT, 8000);
  const publicUrl = (process.env.BRIEF_PUBLIC_URL ?? `http://localhost:${port}`).replace(
    /\/$/,
    "",
  );

  return {
    env: process.env.BRIEF_ENV ?? "development",
    host,
    port,
    publicUrl,
    mcpPath: process.env.BRIEF_MCP_PATH ?? "/mcp",
    databaseUrl: process.env.BRIEF_DATABASE_URL,
    redisUrl: process.env.BRIEF_REDIS_URL,
    graphCacheTtlSeconds: readTtl(process.env.BRIEF_GRAPH_CACHE_TTL_SECONDS, 60),
    google: loadGoogleConfig(publicUrl),
    weather: loadWeatherConfig(),
  };
}
