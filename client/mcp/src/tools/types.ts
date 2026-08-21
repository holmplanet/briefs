export type BriefsMcpAuth = {
  userId: string;
  email?: string;
  token: string;
};

/** Supplies the authenticated token and request dependencies used by Briefs tools. */
export type BriefsToolDeps = {
  requireAccessToken: (extra: unknown) => Promise<BriefsMcpAuth>;
};

export type BriefsToolsConfig = {
  apiUrl?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
};
