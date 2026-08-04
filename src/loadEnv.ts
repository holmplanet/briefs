import fs from "node:fs";
import path from "node:path";

const DOCKER_SECRETS_DIR = "/run/secrets";

/** Secret file name → process.env key */
const SECRET_MAP: Record<string, string> = {
  database_url: "BRIEF_DATABASE_URL",
  auth_admin_secret: "BRIEF_AUTH_ADMIN_SECRET",
  mcp_static_tokens: "BRIEF_MCP_STATIC_TOKENS",
};

// Production secrets are delivered as Docker secret files.
// Local dev secrets are injected by Infisical (`infisical run --env=dev -- ...`).
if (fs.existsSync(DOCKER_SECRETS_DIR)) {
  for (const [file, envKey] of Object.entries(SECRET_MAP)) {
    const filePath = path.join(DOCKER_SECRETS_DIR, file);
    if (fs.existsSync(filePath) && !process.env[envKey]) {
      process.env[envKey] = fs.readFileSync(filePath, "utf8").trim();
    }
  }
}
