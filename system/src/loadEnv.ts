import { readFileSync } from "node:fs";

const SECRET_FILE_KEYS = [
  "BRIEFS_DATABASE_URL",
  "BRIEFS_AUTH_SECRET",
  "BRIEFS_RESEND_API_KEY",
  "BRIEFS_EMAIL_FROM",
] as const;

/** Hydrate unset runtime variables from Docker secrets without logging values. */
export function loadFileSecrets(env: NodeJS.ProcessEnv = process.env): void {
  for (const key of SECRET_FILE_KEYS) {
    if (env[key] || !env[`${key}_FILE`]) continue;

    const value = readFileSync(env[`${key}_FILE`]!, "utf8").trim();
    if (value) env[key] = value;
  }
}
