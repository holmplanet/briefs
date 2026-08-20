export type BriefsMcpAuth = {
  userId: string;
  email?: string;
  token: string;
};

/** Matches the requireAccessToken tool-deps pattern (see mcp-oauth-stack for reference). */
export type BriefsToolDeps = {
  requireAccessToken: (extra: unknown) => Promise<BriefsMcpAuth>;
};

export type BriefsToolsConfig = {
  apiUrl?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
};
