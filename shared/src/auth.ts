export type AccessTokenClaims = {
  sub: string;
  email?: string;
  iss: string;
  exp: number;
  clientId?: string;
  tokenUse?: "access" | "refresh";
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encode(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}

async function signature(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return encode(String.fromCharCode(...new Uint8Array(signed)));
}

export async function issueAccessToken(
  claims: Omit<AccessTokenClaims, "exp" | "tokenUse"> & { tokenUse?: "access" | "refresh" },
  secret: string,
  ttlSeconds = 3600,
): Promise<string> {
  const payload = encode(JSON.stringify({ ...claims, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  return `${payload}.${await signature(payload, secret)}`;
}

export async function verifyAccessToken(
  token: string,
  secret: string,
  issuer: string,
  expectedUse: "access" | "refresh" = "access",
): Promise<AccessTokenClaims | null> {
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const payload = token.slice(0, separator);
  const provided = token.slice(separator + 1);
  const expected = await signature(payload, secret);
  if (provided.length !== expected.length) return null;

  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  if (difference !== 0) return null;

  try {
    const claims = JSON.parse(decoder.decode(Uint8Array.from(decode(payload), (char) => char.charCodeAt(0)))) as AccessTokenClaims;
    if (!claims.sub || claims.iss !== issuer || (claims.tokenUse ?? "access") !== expectedUse || !Number.isFinite(claims.exp) || claims.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}
