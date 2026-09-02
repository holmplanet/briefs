import { toNodeHandler } from "better-auth/node";
import type { Auth } from "better-auth";
import type { NextFunction, Request, Response } from "express";

const COMPATIBILITY_PATHS: Record<string, string> = {
  "/oauth/authorize": "/oauth/oauth2/authorize",
  "/oauth/token": "/oauth/oauth2/token",
  "/oauth/register": "/oauth/oauth2/register",
  "/oauth/consent": "/oauth/oauth2/consent",
  "/oauth/userinfo": "/oauth/oauth2/userinfo",
  "/oauth/introspect": "/oauth/oauth2/introspect",
  "/oauth/revoke": "/oauth/oauth2/revoke",
};

export type BetterAuthCompatibilityOptions = {
  allowedRedirectUris?: readonly string[];
};

export function rewriteBetterAuthCompatibilityPath(requestUrl: string): string {
  const url = new URL(requestUrl, "http://briefs.local");
  const replacement = COMPATIBILITY_PATHS[url.pathname];
  if (replacement) {
    url.pathname = replacement;
  }
  return `${url.pathname}${url.search}`;
}

/**
 * Bridges Briefs' stable OAuth paths to Better Auth's provider routes.
 * This adapter is intentionally separate from createApp until the full
 * protocol and resource-server validation suite passes.
 */
export function createBetterAuthCompatibilityHandler(
  auth: Pick<Auth, "handler">,
  options: BetterAuthCompatibilityOptions = {},
) {
  const handler = toNodeHandler(auth);

  return async function betterAuthCompatibilityHandler(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    const originalUrl = request.url;
    const originalPath = request.path;
    const mountedUrl = request.url.startsWith("/oauth") ? request.url : `/oauth${request.url}`;
    const isJwtTokenRequest = request.method === "GET" && originalPath === "/oauth/token";
    request.url = isJwtTokenRequest ? mountedUrl : rewriteBetterAuthCompatibilityPath(mountedUrl);
    const registrationPath = originalPath === "/oauth/register" || originalPath === "/oauth/oauth2/register";
      if (registrationPath && options.allowedRedirectUris?.length) {
        const redirectUris = request.body?.redirect_uris;
        if (
          !Array.isArray(redirectUris) ||
          redirectUris.length === 0 ||
          redirectUris.some((redirectUri: unknown) => typeof redirectUri !== "string" || !options.allowedRedirectUris!.includes(redirectUri))
        ) {
          response.status(400).json({
            error: "invalid_redirect_uri",
            error_description: "Every redirect URI must exactly match a configured Briefs redirect URI",
          });
          request.url = originalUrl;
          return;
        }
      }

    try {
      await handler(request, response);
    } catch (error) {
      next(error);
    } finally {
      request.url = originalUrl;
    }
  };
}
