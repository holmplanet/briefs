import { GOOGLE_CALENDAR_READONLY_SCOPE } from "./auth/types.js";
import { loadWeatherConfig, type WeatherConfig } from "./connectors/personal/weather/config.js";

export const VERSION = "0.1.0";
export type { WeatherConfig };

export type McpAuthConfig = {
  enabled: boolean;
  adminSecret?: string;
  serverUri: string;
  staticTokens?: string;
};

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
  legacyConnectors: boolean;
  google?: GoogleConfig;
  weather?: WeatherConfig;
  mcpAuth: McpAuthConfig;
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

function loadMcpAuthConfig(publicUrl: string, mcpPath: string): McpAuthConfig {
  const explicitDisable = process.env.BRIEF_MCP_AUTH_DISABLED === "true";
  const explicitEnable = process.env.BRIEF_MCP_AUTH_ENABLED === "true";
  const isProduction = (process.env.BRIEF_ENV ?? "development") === "production";

  return {
    enabled: explicitDisable ? false : explicitEnable || isProduction,
    adminSecret: process.env.BRIEF_AUTH_ADMIN_SECRET,
    serverUri: `${publicUrl}${mcpPath}`,
    staticTokens: process.env.BRIEF_MCP_STATIC_TOKENS,
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
    legacyConnectors: process.env.BRIEF_LEGACY_CONNECTORS === "true",
    google: loadGoogleConfig(publicUrl),
    weather: loadWeatherConfig(),
    mcpAuth: loadMcpAuthConfig(publicUrl, process.env.BRIEF_MCP_PATH ?? "/mcp"),
  };
}
