import { loadFileSecrets } from "./loadEnv.js";

export type BriefsConfig = {
  env: string;
  host: string;
  port: number;
  databaseUrl?: string;
  authSecret: string;
  oauthIssuer: string;
  authDevBypass: boolean;
  oauthClientId: string;
  oauthRedirectUris: string[];
  otpMailer: "console" | "resend";
  resendApiKey?: string;
  emailFrom?: string;
  otpTtlSeconds: number;
};

function readPort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(): BriefsConfig {
  loadFileSecrets();

  return {
    env: process.env.BRIEFS_ENV ?? "development",
    host: process.env.BRIEFS_HOST ?? "0.0.0.0",
    port: readPort(process.env.BRIEFS_PORT, 8001),
    databaseUrl: process.env.BRIEFS_DATABASE_URL,
    authSecret: process.env.BRIEFS_AUTH_SECRET ?? "dev-briefs-auth-secret",
    oauthIssuer: (process.env.BRIEFS_OAUTH_ISSUER ?? `http://localhost:${readPort(process.env.BRIEFS_PORT, 8001)}/oauth`).replace(/\/$/, ""),
    authDevBypass: process.env.BRIEFS_API_DEV_BYPASS !== "false" && (process.env.BRIEFS_ENV ?? "development") !== "production",
    oauthClientId: process.env.BRIEFS_OAUTH_CLIENT_ID ?? "briefs-daily",
    oauthRedirectUris: (process.env.BRIEFS_OAUTH_REDIRECT_URIS ?? "http://localhost:3000/auth/callback").split(",").map((value) => value.trim()).filter(Boolean),
    otpMailer: process.env.BRIEFS_OTP_MAILER === "resend" ? "resend" : "console",
    resendApiKey: process.env.BRIEFS_RESEND_API_KEY,
    emailFrom: process.env.BRIEFS_EMAIL_FROM,
    otpTtlSeconds: readPort(process.env.BRIEFS_OTP_TTL_SECONDS, 600),
  };
}
