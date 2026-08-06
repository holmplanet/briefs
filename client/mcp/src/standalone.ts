import { randomUUID } from "node:crypto";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express from "express";

import { registerBriefsTools } from "./tools/index.js";
import type { BriefsMcpAuth } from "./tools/types.js";

const port = Number(process.env.BRIEFS_MCP_PORT ?? 3334);
const devUserId = process.env.BRIEFS_DEV_USER_ID ?? "demo";
const devSkipAuth = process.env.BRIEFS_MCP_DEV_SKIP_AUTH !== "false";

type Session = {
  transport: StreamableHTTPServerTransport;
  user: BriefsMcpAuth;
};

const sessions = new Map<string, Session>();

function resolveAuth(req: express.Request): BriefsMcpAuth | null {
  if (devSkipAuth && process.env.NODE_ENV !== "production") {
    return {
      userId: devUserId,
      email: "dev@localhost",
      token: "dev-token",
    };
  }

  const authHeader = req.headers.authorization ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  // Production: validate bearer tokens from Briefs' own OAuth issuer.
  return {
    userId: req.header("x-briefs-user-id") ?? devUserId,
    token: authHeader.slice(7).trim(),
  };
}

async function createServerTransport(user: BriefsMcpAuth): Promise<StreamableHTTPServerTransport> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessions.set(sessionId, { transport, user });
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
  };

  const server = new McpServer({ name: "briefs-mcp", version: "0.1.0" });
  registerBriefsTools(server, {
    requireAccessToken: async () => user,
  });
  await server.connect(transport);

  return transport;
}

const app = express();

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "briefs-mcp", devSkipAuth });
});

app.post("/mcp", express.json(), async (req, res) => {
  const user = resolveAuth(req);
  if (!user) {
    res.status(401).json({ error: "unauthorized", error_description: "Bearer token required" });
    return;
  }

  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let session = sessionId ? sessions.get(sessionId) : undefined;
  let transport = session?.transport;

  if (!transport) {
    if (!isInitializeRequest(req.body)) {
      res.status(400).json({ error: "No active session. Send Initialize first." });
      return;
    }

    transport = await createServerTransport(user);
  }

  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const session = sessionId ? sessions.get(sessionId) : undefined;
  if (!session) {
    res.status(400).json({ error: "No active session" });
    return;
  }

  await session.transport.handleRequest(req, res);
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const session = sessionId ? sessions.get(sessionId) : undefined;
  if (session) {
    try {
      await session.transport.close();
    } catch {
      // Best-effort cleanup.
    }
  }

  res.status(200).end();
});

app.listen(port, () => {
  console.log(`Briefs MCP dev server: http://localhost:${port}/mcp`);
  console.log(`Briefs API: ${process.env.BRIEFS_API_URL ?? "http://localhost:8001"}`);
  console.log(`Dev user: ${devUserId} (BRIEFS_MCP_DEV_SKIP_AUTH=${devSkipAuth})`);
});
