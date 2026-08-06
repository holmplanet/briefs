export type BriefsMcpAuth = {
  userId: string;
  email?: string;
  token: string;
};

/** Matches mcp-oauth-stack ToolDeps so tools plug into registerTools hooks. */
export type BriefsToolDeps = {
  requireAccessToken: (extra: unknown) => Promise<BriefsMcpAuth>;
};

export type BriefsToolsConfig = {
  apiUrl?: string;
};
