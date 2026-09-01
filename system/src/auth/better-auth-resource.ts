import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export type BetterAuthAccessClaims = JWTPayload & {
  sub: string;
  email?: string;
};

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(jwksUrl: string) {
  let jwks = jwksCache.get(jwksUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(jwksUrl));
    jwksCache.set(jwksUrl, jwks);
  }
  return jwks;
}

/**
 * Verifies a Better Auth JWT at a resource server boundary.
 *
 * The issuer and audience are deliberately required so a token issued for
 * one Briefs resource cannot be accepted by another resource accidentally.
 * Invalid, expired, unsigned, or otherwise malformed tokens return null.
 */
export async function verifyBetterAuthAccessToken(
  token: string,
  options: {
    issuer: string;
    audience: string;
    jwksUrl?: string;
  },
): Promise<BetterAuthAccessClaims | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwks(options.jwksUrl ?? `${options.issuer}/jwks`), {
      issuer: options.issuer,
      audience: options.audience,
    });

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      return null;
    }

    return payload as BetterAuthAccessClaims;
  } catch {
    return null;
  }
}
