export const VERSION = "0.1.0";

export type BriefEnv = {
  env: string;
  host: string;
  port: number;
  publicUrl: string;
  mcpPath: string;
  databaseUrl?: string;
  redisUrl?: string;
  graphCacheTtlSeconds: number;
};

function readPort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readTtl(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
  };
}
