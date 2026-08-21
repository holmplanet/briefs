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
  oauthAllowedEmails: string[];
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

  const env = process.env.APP_ENV ?? "development";
  const oauthAllowedEmails = (process.env.AUTH_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (env === "production" && oauthAllowedEmails.length === 0) {
    throw new Error("Production Briefs requires AUTH_ALLOWED_EMAILS or an explicit public-signup policy");
  }

  return {
    env,
    host: process.env.APP_HOST ?? "0.0.0.0",
    port: readPort(process.env.APP_PORT, 8001),
    databaseUrl: process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL,
    authSecret: process.env.AUTH_SECRET ?? "dev-briefs-auth-secret",
    oauthIssuer: (process.env.OAUTH_ISSUER ?? `http://localhost:${readPort(process.env.APP_PORT, 8001)}/oauth`).replace(/\/$/, ""),
    authDevBypass: process.env.API_DEV_BYPASS !== "false" && (process.env.APP_ENV ?? "development") !== "production",
    oauthClientId: process.env.OAUTH_CLIENT_ID ?? "briefs-daily",
    oauthRedirectUris: (process.env.OAUTH_REDIRECT_URIS ?? "http://localhost:3000/auth/callback").split(",").map((value) => value.trim()).filter(Boolean),
    oauthAllowedEmails,
    otpMailer: process.env.OTP_MAILER === "resend" ? "resend" : "console",
    resendApiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM,
    otpTtlSeconds: readPort(process.env.OTP_TTL_SECONDS, 600),
  };
}
