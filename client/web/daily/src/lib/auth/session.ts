import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import type { AuthConfig } from "./config";

export const SESSION_COOKIE = "briefs_daily_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type DailySession = {
  userId: string;
  email?: string;
  expiresAt: number;
  devBypass?: boolean;
};

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function encodeSession(session: DailySession, secret: string): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

function decodeSession(raw: string | undefined, secret: string): DailySession | null {
  if (!raw) {
    return null;
  }

  const idx = raw.lastIndexOf(".");
  if (idx === -1) {
    return null;
  }

  const payload = raw.slice(0, idx);
  const signature = raw.slice(idx + 1);
  const expected = sign(payload, secret);

  try {
    const a = Buffer.from(signature, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DailySession;
    if (!session.userId || session.expiresAt <= Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function getSession(config: AuthConfig): Promise<DailySession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = decodeSession(raw, config.sessionSecret);

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
  const value = encodeSession(
    {
      ...session,
      expiresAt: Date.now() + SESSION_TTL_MS,
    },
    config.sessionSecret,
  );

  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function decodeSessionValue(raw: string | undefined, secret: string): DailySession | null {
  return decodeSession(raw, secret);
}
