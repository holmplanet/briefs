export const GOOGLE_OAUTH_PROVIDER = "google";

export const GOOGLE_CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

export type OAuthTokens = {
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes: string[];
};

export interface OAuthTokenStore {
  get(userId: string, provider: string): Promise<OAuthTokens | undefined>;
  save(tokens: OAuthTokens): Promise<void>;
  delete(userId: string, provider: string): Promise<void>;
}
