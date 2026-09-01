import { cookies } from "next/headers";

import type { AuthConfig } from "./config";

export const SESSION_COOKIE = "briefs_daily_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type DailySession = {
  userId: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  expiresAt: number;
  devBypass?: boolean;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload));
  return encodeBase64Url(new Uint8Array(signature));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

export async function encodeSessionValue(session: DailySession, secret: string): Promise<string> {
  const payload = encodeBase64Url(textEncoder.encode(JSON.stringify(session)));
  return payload + "." + (await sign(payload, secret));
}

async function decodeSession(raw: string | undefined, secret: string): Promise<DailySession | null> {
  if (!raw) {
    return null;
  }

  const idx = raw.lastIndexOf(".");
  if (idx === -1) {
    return null;
  }

  const payload = raw.slice(0, idx);
  const signature = raw.slice(idx + 1);
  const expected = await sign(payload, secret);

  try {
    if (!constantTimeEqual(signature, expected)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const session = JSON.parse(textDecoder.decode(decodeBase64Url(payload))) as DailySession;
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
  const session = await decodeSession(raw, config.sessionSecret);

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
  return decodeSession(raw, secret);
}
