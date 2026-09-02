import { createHash, randomBytes } from "node:crypto";

export type FlightAuthConfig = {
  issuer: string | null;
  appUrl: string;
  clientId: string;
  clientSecret: string | null;
  sessionSecret: string;
};

type OAuthMetadata = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

export function loadFlightAuthConfig(): FlightAuthConfig {
  return {
    issuer: process.env.OAUTH_ISSUER?.replace(/\/$/, "") ?? null,
    appUrl: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    clientId: process.env.OAUTH_CLIENT_ID ?? "briefs-daily",
    clientSecret: process.env.OAUTH_CLIENT_SECRET ?? null,
    sessionSecret: process.env.SESSION_SECRET ?? "dev-briefs-session-secret",
  };
}

export function createPkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  return {
    verifier,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
  };
}

export function createOAuthState() {
  return randomBytes(24).toString("base64url");
}

async function metadata(config: FlightAuthConfig, requestFetch: typeof fetch): Promise<OAuthMetadata> {
  if (!config.issuer) throw new Error("OAuth issuer is not configured");
  const response = await requestFetch(`${config.issuer}/.well-known/oauth-authorization-server`);
  if (!response.ok) throw new Error("Unable to load OAuth metadata");
  return await response.json() as OAuthMetadata;
}

export async function buildAuthorizeUrl(config: FlightAuthConfig, state: string, challenge: string) {
  const endpoints = await metadata(config, fetch);
  const url = new URL(endpoints.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", `${config.appUrl}/auth/callback`);
  url.searchParams.set("scope", "openid email profile offline_access");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function exchangeCode(config: FlightAuthConfig, code: string, verifier: string) {
  const endpoints = await metadata(config, fetch);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: `${config.appUrl}/auth/callback`,
    client_id: config.clientId,
    code_verifier: verifier,
  });
  if (config.clientSecret) body.set("client_secret", config.clientSecret);
  const response = await fetch(endpoints.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error((await response.text()) || "Token exchange failed");
  const tokens = await response.json() as TokenResponse;
  const profileResponse = await fetch(endpoints.userinfo_endpoint ?? `${config.issuer}/oidc/me`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileResponse.ok) throw new Error("Unable to load OAuth profile");
  const profile = await profileResponse.json() as { sub: string; email?: string };
  return {
    userId: profile.sub,
    email: profile.email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessTokenExpiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
  };
}
