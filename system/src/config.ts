export type BriefsConfig = {
  env: string;
  host: string;
  port: number;
  databaseUrl?: string;
  authSecret: string;
  oauthIssuer: string;
  authDevBypass: boolean;
};

function readPort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(): BriefsConfig {
  return {
    env: process.env.BRIEFS_ENV ?? "development",
    host: process.env.BRIEFS_HOST ?? "0.0.0.0",
    port: readPort(process.env.BRIEFS_PORT, 8001),
    databaseUrl: process.env.BRIEFS_DATABASE_URL,
    authSecret: process.env.BRIEFS_AUTH_SECRET ?? "dev-briefs-auth-secret",
    oauthIssuer: (process.env.BRIEFS_OAUTH_ISSUER ?? `http://localhost:${readPort(process.env.BRIEFS_PORT, 8001)}/oauth`).replace(/\/$/, ""),
    authDevBypass: process.env.BRIEFS_API_DEV_BYPASS !== "false" && (process.env.BRIEFS_ENV ?? "development") !== "production",
  };
}
