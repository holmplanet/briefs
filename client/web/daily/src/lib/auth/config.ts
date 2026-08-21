export type AuthConfig = {
  /** OAuth issuer URL (reference patterns: mcp-oauth-stack MCP_PUBLIC_URL). */
  issuer: string | null;
  clientId: string;
  clientSecret: string | null;
  authSecret: string;
  sessionSecret: string;
  /** Daily origin for redirect_uri (e.g. http://localhost:3000). */
  appUrl: string;
  devBypass: boolean;
  devUserId: string;
};

export function loadAuthConfig(): AuthConfig {
  const issuer = process.env.OAUTH_ISSUER?.replace(/\/$/, "") ?? null;
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const production = process.env.APP_ENV
    ? process.env.APP_ENV === "production"
    : process.env.NODE_ENV === "production";
  const building = process.env.NEXT_PHASE === "phase-production-build";
  const authSecret = process.env.AUTH_SECRET ?? "";
  const sessionSecret = process.env.SESSION_SECRET ?? "dev-briefs-session-secret";
  const devBypass = !production && (
    process.env.AUTH_DEV_BYPASS === "true" ||
    (!issuer && process.env.NODE_ENV !== "production")
  );

  if (production && !building && !issuer) {
    throw new Error("Production Daily requires OAUTH_ISSUER");
  }
  if (production && !building && devBypass) {
    throw new Error("Production Daily cannot enable AUTH_DEV_BYPASS");
  }
  if (production && !building && sessionSecret === "dev-briefs-session-secret") {
    throw new Error("Production Daily requires a non-default SESSION_SECRET");
  }
  if (production && !building && !authSecret) {
    throw new Error("Production Daily requires AUTH_SECRET");
  }

  return {
    issuer,
    clientId: process.env.OAUTH_CLIENT_ID ?? "briefs-daily",
    clientSecret: process.env.OAUTH_CLIENT_SECRET ?? null,
    authSecret,
    sessionSecret,
    appUrl,
    devBypass,
    devUserId: process.env.DEV_USER_ID ?? process.env.NEXT_PUBLIC_USER_ID ?? "demo",
  };
}

export function isOAuthEnabled(config: AuthConfig): boolean {
  return Boolean(config.issuer);
}

export function redirectUri(config: AuthConfig): string {
  return `${config.appUrl}/auth/callback`;
}
