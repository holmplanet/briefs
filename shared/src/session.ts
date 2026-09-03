export type BriefsSession = {
  userId: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  expiresAt: number;
  devBypass?: boolean;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
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

export async function encodeBriefsSession(session: BriefsSession, secret: string): Promise<string> {
  const payload = encodeBase64Url(encoder.encode(JSON.stringify(session)));
  return `${payload}.${await sign(payload, secret)}`;
}

export async function decodeBriefsSession(raw: string | undefined, secret: string): Promise<BriefsSession | null> {
  if (!raw) return null;
  const separator = raw.lastIndexOf(".");
  if (separator < 1) return null;

  const payload = raw.slice(0, separator);
  const provided = raw.slice(separator + 1);
  try {
    if (!constantTimeEqual(provided, await sign(payload, secret))) return null;
    const session = JSON.parse(decoder.decode(decodeBase64Url(payload))) as BriefsSession;
    return session.userId && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}
