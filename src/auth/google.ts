import type { GoogleConfig } from "../config.js";
import {
  GOOGLE_CALENDAR_READONLY_SCOPE,
  GOOGLE_OAUTH_PROVIDER,
  type OAuthTokens,
} from "./types.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export type GoogleOAuthState = {
  userId: string;
};

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

export function encodeOAuthState(state: GoogleOAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

export function decodeOAuthState(value: string): GoogleOAuthState {
  const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as GoogleOAuthState;
  if (!parsed.userId || typeof parsed.userId !== "string") {
    throw new Error("Invalid OAuth state");
  }
  return parsed;
}

export function buildGoogleAuthUrl(config: GoogleConfig, userId: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: encodeOAuthState({ userId }),
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleAuthCode(
  config: GoogleConfig,
  code: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Omit<OAuthTokens, "userId">> {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google token exchange failed (${response.status}): ${detail.slice(0, 240)}`);
  }

  const payload = (await response.json()) as GoogleTokenResponse;
  return toGoogleTokenPayload(payload);
}

export async function refreshGoogleAccessToken(
  config: GoogleConfig,
  refreshToken: string,
  userId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google token refresh failed (${response.status}): ${detail.slice(0, 240)}`);
  }

  const payload = (await response.json()) as GoogleTokenResponse;
  return {
    userId,
    ...toGoogleTokenPayload(payload),
    refreshToken,
  };
}

function toGoogleTokenPayload(payload: GoogleTokenResponse): Omit<OAuthTokens, "userId"> {
  const expiresAt =
    payload.expires_in !== undefined
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : undefined;

  return {
    provider: GOOGLE_OAUTH_PROVIDER,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt,
    scopes: payload.scope?.split(" ").filter(Boolean) ?? [GOOGLE_CALENDAR_READONLY_SCOPE],
  };
}

export function isAccessTokenExpired(tokens: OAuthTokens): boolean {
  if (!tokens.expiresAt) {
    return false;
  }
  return Date.parse(tokens.expiresAt) <= Date.now() + 60_000;
}

export async function getValidGoogleAccessToken(
  config: GoogleConfig,
  tokenStore: { get: (userId: string, provider: string) => Promise<OAuthTokens | undefined>; save: (tokens: OAuthTokens) => Promise<void> },
  userId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const tokens = await tokenStore.get(userId, GOOGLE_OAUTH_PROVIDER);
  if (!tokens) {
    throw new Error("Google Calendar is not connected. Visit /auth/google/start?userId=...");
  }

  if (!isAccessTokenExpired(tokens)) {
    return tokens.accessToken;
  }

  if (!tokens.refreshToken) {
    throw new Error("Google access token expired and no refresh token is available");
  }

  const refreshed = await refreshGoogleAccessToken(config, tokens.refreshToken, userId, fetchImpl);
  await tokenStore.save(refreshed);
  return refreshed.accessToken;
}
