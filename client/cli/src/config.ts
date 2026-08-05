export type CliConfig = {
  apiUrl: string;
  userId: string;
  json: boolean;
  quiet: boolean;
};

export type GlobalFlagOverrides = {
  apiUrl?: string;
  userId?: string;
  json?: boolean;
  quiet?: boolean;
};

export function loadConfig(overrides: GlobalFlagOverrides = {}): CliConfig {
  return {
    apiUrl: (overrides.apiUrl ?? process.env.BRIEFS_API_URL ?? "http://localhost:8001").replace(
      /\/$/,
      "",
    ),
    userId: overrides.userId ?? process.env.BRIEFS_USER_ID ?? "demo",
    json: overrides.json ?? false,
    quiet: overrides.quiet ?? false,
  };
}
