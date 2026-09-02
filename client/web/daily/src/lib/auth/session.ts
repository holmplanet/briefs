import { cookies } from "next/headers";
import { decodeBriefsSession, encodeBriefsSession, type BriefsSession } from "@briefs/shared/session";

import type { AuthConfig } from "./config";

export const SESSION_COOKIE = "briefs_daily_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type DailySession = BriefsSession;

export async function encodeSessionValue(session: DailySession, secret: string): Promise<string> {
  return encodeBriefsSession(session, secret);
}

export async function getSession(config: AuthConfig): Promise<DailySession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await decodeBriefsSession(raw, config.sessionSecret);

  console.info("[Briefs Daily] Daily session check", {
    hasCookie: Boolean(raw),
    cookieLength: raw?.length ?? 0,
    valid: Boolean(session),
  });

  if (session) {
    return session;
  }

  if (config.devBypass) {
    return {
      userId: config.devUserId,
      email: "dev@localhost",
      expiresAt: Date.now() + SESSION_TTL_MS,
      devBypass: true,
    };
  }

  return null;
}

export async function setSession(config: AuthConfig, session: Omit<DailySession, "expiresAt">): Promise<void> {
  const cookieStore = await cookies();
  const value = await encodeSessionValue(
    {
      ...session,
      expiresAt: Date.now() + SESSION_TTL_MS,
    },
    config.sessionSecret,
  );

  console.info("[Briefs Daily] Daily session created", {
    cookieLength: value.length,
    hasAccessToken: Boolean(session.accessToken),
    hasRefreshToken: Boolean(session.refreshToken),
  });

  cookieStore.set(SESSION_COOKIE, value, sessionCookieOptions());
}

export async function createSessionCookieValue(
  config: AuthConfig,
  session: Omit<DailySession, "expiresAt">,
): Promise<string> {
  return encodeSessionValue(
    {
      ...session,
      expiresAt: Date.now() + SESSION_TTL_MS,
    },
    config.sessionSecret,
  );
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  } as const;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function decodeSessionValue(raw: string | undefined, secret: string): Promise<DailySession | null> {
  return decodeBriefsSession(raw, secret);
}
