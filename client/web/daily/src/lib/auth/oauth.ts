import type { AuthConfig } from "./config";
import { redirectUri } from "./config";

type OAuthMetadata = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
  token_type: string;
};

type UserInfo = {
  sub: string;
  email?: string;
};

export type OAuthUser = {
  userId: string;
  email?: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
};

let metadataCache: OAuthMetadata | null = null;

type OAuthFetch = typeof fetch;

async function fetchMetadata(issuer: string, requestFetch: OAuthFetch = fetch): Promise<OAuthMetadata> {
  if (metadataCache) {
    return metadataCache;
  }

  const response = await requestFetch(`${issuer}/.well-known/oauth-authorization-server`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Failed to load OAuth metadata from ${issuer}`);
  }

  metadataCache = (await response.json()) as OAuthMetadata;
  return metadataCache;
}

export async function buildAuthorizeUrl(
  config: AuthConfig,
  state: string,
  challenge: string,
  requestFetch: OAuthFetch = fetch,
): Promise<string> {
  if (!config.issuer) {
    throw new Error("OAuth issuer is not configured");
  }

  const metadata = await fetchMetadata(config.issuer, requestFetch);
  const url = new URL(metadata.authorization_endpoint);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri(config));
  url.searchParams.set("scope", "openid email profile offline_access");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (config.apiResource) url.searchParams.append("resource", config.apiResource);

  return url.toString();
}

export async function exchangeCodeForUser(
  config: AuthConfig,
  code: string,
  verifier: string,
  requestFetch: OAuthFetch = fetch,
): Promise<OAuthUser> {
  if (!config.issuer) {
    throw new Error("OAuth issuer is not configured");
  }

  const metadata = await fetchMetadata(config.issuer, requestFetch);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(config),
    client_id: config.clientId,
    code_verifier: verifier,
  });

  if (config.clientSecret) {
    body.set("client_secret", config.clientSecret);
  }

  const tokenResponse = await requestFetch(metadata.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text();
    throw new Error(detail || "Token exchange failed");
  }

  const tokens = (await tokenResponse.json()) as TokenResponse;
  const userinfoEndpoint = metadata.userinfo_endpoint ?? `${config.issuer}/oidc/me`;

  const userinfoResponse = await requestFetch(userinfoEndpoint, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  if (!userinfoResponse.ok) {
    throw new Error("Failed to load user profile from OAuth provider");
  }

  const profile = (await userinfoResponse.json()) as UserInfo;
  return {
    userId: profile.sub,
    email: profile.email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessTokenExpiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
  };
}

export async function refreshAccessToken(
  config: AuthConfig,
  refreshToken: string,
  requestFetch: OAuthFetch = fetch,
): Promise<Pick<OAuthUser, "accessToken" | "refreshToken" | "accessTokenExpiresAt">> {
  if (!config.issuer) {
    throw new Error("OAuth issuer is not configured");
  }

  const metadata = await fetchMetadata(config.issuer, requestFetch);
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
  });
  if (config.clientSecret) body.set("client_secret", config.clientSecret);

  const tokenResponse = await requestFetch(metadata.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text();
    throw new Error(detail || "Token refresh failed");
  }

  const tokens = (await tokenResponse.json()) as TokenResponse;
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? refreshToken,
    accessTokenExpiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
  };
}
