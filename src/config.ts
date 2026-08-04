export const VERSION = "0.1.0";

export type McpAuthConfig = {
  enabled: boolean;
  adminSecret?: string;
  serverUri: string;
  staticTokens?: string;
};

export type BriefEnv = {
  env: string;
  host: string;
  port: number;
  publicUrl: string;
  mcpPath: string;
  allowedHosts: string[];
  databaseUrl?: string;
  redisUrl?: string;
  graphCacheTtlSeconds: number;
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

function readAllowedHosts(host: string, port: number): string[] {
  const defaults = ["localhost", "127.0.0.1", `${host}:${port}`];
  const extra =
    process.env.BRIEF_ALLOWED_HOSTS?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  return [...new Set([...defaults, ...extra])];
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
    allowedHosts: readAllowedHosts(host, port),
    databaseUrl: process.env.BRIEF_DATABASE_URL,
    redisUrl: process.env.BRIEF_REDIS_URL,
    graphCacheTtlSeconds: readTtl(process.env.BRIEF_GRAPH_CACHE_TTL_SECONDS, 60),
    mcpAuth: loadMcpAuthConfig(publicUrl, process.env.BRIEF_MCP_PATH ?? "/mcp"),
  };
}
