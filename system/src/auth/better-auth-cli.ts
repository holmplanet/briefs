import { Pool } from "pg";

import { createBetterAuthSpike } from "./better-auth-spike.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://briefs:briefs@127.0.0.1:5432/briefs",
});

export const auth = createBetterAuthSpike(pool, {
  issuer: process.env.OAUTH_ISSUER ?? "http://localhost:8001/oauth",
  secret: process.env.AUTH_SECRET ?? "spike-auth-secret-0123456789-abcdef",
  allowedEmails: (process.env.AUTH_ALLOWED_EMAILS ?? "owner@example.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  mcpResource: process.env.MCP_RESOURCE ?? "http://localhost:3334/mcp",
  apiResource: process.env.API_RESOURCE ?? "http://localhost:8001/api",
  sendOtp: async () => undefined,
});
