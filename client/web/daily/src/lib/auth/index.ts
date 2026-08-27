import { loadAuthConfig, isOAuthEnabled } from "./config";
import { getSession } from "./session";

export { buildAuthorizeUrl, exchangeCodeForUser, refreshAccessToken } from "./oauth";
export { clearSession, getSession, setSession, SESSION_COOKIE } from "./session";
export { createOAuthState, createPkcePair } from "./pkce";
export { loadAuthConfig, isOAuthEnabled, redirectUri, safeNextPath } from "./config";
export type { AuthConfig } from "./config";
export type { DailySession } from "./session";

export async function requireSession() {
  const config = loadAuthConfig();
  const session = await getSession(config);

  if (!session) {
    return { config, session: null };
  }

  return { config, session };
}
