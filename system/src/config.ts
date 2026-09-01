import { loadFileSecrets } from "./loadEnv.js";

export type BriefsConfig = {
  env: string;
  authProvider: "legacy" | "better-auth";
  host: string;
  port: number;
  databaseUrl?: string;
  authSecret: string;
  oauthIssuer: string;
  authDevBypass: boolean;
  oauthClientId: string;
  oauthRedirectUris: string[];
  oauthAllowedRedirectUris: string[];
  oauthAllowedEmails: string[];
  mcpResource: string;
  apiResource: string;
  otpMailer: "console" | "resend";
  resendApiKey?: string;
  emailFrom?: string;
  otpTtlSeconds: number;
};

function readPort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function isProductionEnvironment(): boolean {
  return process.env.APP_ENV === "production"
    || process.env.NODE_ENV === "production"
    || process.env.VERCEL_ENV === "production";
}

function resolveEnvironment(): string {
  if (isProductionEnvironment()) return "production";
  if (process.env.APP_ENV) return process.env.APP_ENV;
  if (process.env.VERCEL_ENV === "preview") return "preview";
  return "development";
}

export function loadConfig(): BriefsConfig {
  loadFileSecrets();

  const env = resolveEnvironment();
  const oauthAllowedEmails = (process.env.AUTH_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const oauthAllowedRedirectUris = (process.env.OAUTH_ALLOWED_REDIRECT_URIS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    env === "production" &&
    (oauthAllowedEmails.length < 1 ||
      oauthAllowedEmails.length > 2 ||
      new Set(oauthAllowedEmails).size !== oauthAllowedEmails.length ||
      oauthAllowedEmails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
  ) {
    throw new Error("Production Briefs requires one or two unique valid AUTH_ALLOWED_EMAILS entries");
  }

  const mcpResource = process.env.MCP_RESOURCE ?? "http://localhost:3334/mcp";
  const apiResource = process.env.API_RESOURCE ?? `${new URL((process.env.OAUTH_ISSUER ?? `http://localhost:${readPort(process.env.APP_PORT, 8001)}/oauth`).replace(/\/$/, "")).origin}/api`;
  return {
    env,
    authProvider: process.env.AUTH_PROVIDER === "better-auth" ? "better-auth" : "legacy",
    host: process.env.APP_HOST ?? "0.0.0.0",
    port: readPort(process.env.APP_PORT, 8001),
    databaseUrl: process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL,
    authSecret: process.env.AUTH_SECRET ?? "dev-briefs-auth-secret",
    oauthIssuer: (process.env.OAUTH_ISSUER ?? `http://localhost:${readPort(process.env.APP_PORT, 8001)}/oauth`).replace(/\/$/, ""),
    authDevBypass: process.env.API_DEV_BYPASS !== "false" && !isProductionEnvironment(),
    oauthClientId: process.env.OAUTH_CLIENT_ID ?? "briefs-daily",
    oauthRedirectUris: (process.env.OAUTH_REDIRECT_URIS ?? "http://localhost:3000/auth/callback").split(",").map((value) => value.trim()).filter(Boolean),
    oauthAllowedRedirectUris,
    oauthAllowedEmails,
    mcpResource,
    apiResource,
    otpMailer: process.env.OTP_MAILER === "resend" ? "resend" : "console",
    resendApiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM,
    otpTtlSeconds: readPort(process.env.OTP_TTL_SECONDS, 600),
  };
}
