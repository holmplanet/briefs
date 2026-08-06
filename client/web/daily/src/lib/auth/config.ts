export type AuthConfig = {
  /** OAuth issuer URL (reference patterns: mcp-oauth-stack MCP_PUBLIC_URL). */
  issuer: string | null;
  clientId: string;
  clientSecret: string | null;
  sessionSecret: string;
  /** Daily origin for redirect_uri (e.g. http://localhost:3000). */
  appUrl: string;
  devBypass: boolean;
  devUserId: string;
};

export function loadAuthConfig(): AuthConfig {
  const issuer = process.env.BRIEFS_OAUTH_ISSUER?.replace(/\/$/, "") ?? null;
  const appUrl = (process.env.BRIEFS_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return {
    issuer,
    clientId: process.env.BRIEFS_OAUTH_CLIENT_ID ?? "briefs-daily",
    clientSecret: process.env.BRIEFS_OAUTH_CLIENT_SECRET ?? null,
    sessionSecret: process.env.BRIEFS_SESSION_SECRET ?? "dev-briefs-session-secret",
    appUrl,
    devBypass:
      process.env.BRIEFS_AUTH_DEV_BYPASS === "true" ||
      (!issuer && process.env.NODE_ENV !== "production"),
    devUserId: process.env.BRIEFS_DEV_USER_ID ?? process.env.NEXT_PUBLIC_BRIEFS_USER_ID ?? "demo",
  };
}

export function isOAuthEnabled(config: AuthConfig): boolean {
  return Boolean(config.issuer);
}

export function redirectUri(config: AuthConfig): string {
  return `${config.appUrl}/auth/callback`;
}
