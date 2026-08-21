export function getBriefsHealthUrls(apiBase: string): string[] {
  const base = apiBase.replace(/\/$/, "");
  return base.endsWith("/api") ? [`${base}/health`] : [`${base}/api/health`, `${base}/health`];
}
