export function getMcpResourceMetadataUrl(request: Request): string {
  const appUrl = process.env.APP_URL?.trim();
  let baseUrl = new URL(request.url);
  if (appUrl) {
    try {
      const configuredUrl = new URL(appUrl);
      if (configuredUrl.protocol === "http:" || configuredUrl.protocol === "https:") baseUrl = configuredUrl;
    } catch {
      // Fall back to the request URL if deployment configuration is malformed.
    }
  }
  const requestPath = new URL(request.url).pathname;
  const metadataPath = requestPath === "/api/mcp"
    ? "/api/mcp/.well-known/oauth-protected-resource"
    : "/.well-known/oauth-protected-resource";
  return new URL(metadataPath, baseUrl).toString();
}
