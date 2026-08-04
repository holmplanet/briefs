export type BriefConfig = {
  env: string;
  host: string;
  port: number;
  databaseUrl?: string;
};

function readPort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(): BriefConfig {
  return {
    env: process.env.BRIEF_ENV ?? "development",
    host: process.env.BRIEF_HOST ?? "0.0.0.0",
    port: readPort(process.env.BRIEF_PORT, 8000),
    databaseUrl: process.env.BRIEF_DATABASE_URL,
  };
}
