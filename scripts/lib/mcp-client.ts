import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export type McpClientOptions = {
  baseUrl?: string;
  mcpPath?: string;
  authToken?: string;
  clientName: string;
};

export function readMcpPayload(result: {
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}): unknown {
  if (result.structuredContent && typeof result.structuredContent === "object") {
    return result.structuredContent;
  }

  const text = result.content.find((item) => item.type === "text")?.text;
  return text ? JSON.parse(text) : result;
}

export async function createMcpClient(options: McpClientOptions): Promise<{
  client: Client;
  transport: StreamableHTTPClientTransport;
  close: () => Promise<void>;
}> {
  const baseUrl = options.baseUrl ?? process.env.BRIEF_PUBLIC_URL ?? "http://localhost:8000";
  const mcpPath = options.mcpPath ?? process.env.BRIEF_MCP_PATH ?? "/mcp";
  const authToken = options.authToken ?? process.env.BRIEF_DOGFOOD_TOKEN;

  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const client = new Client({ name: options.clientName, version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}${mcpPath}`), {
    requestInit: { headers },
  });

  await client.connect(transport);

  return {
    client,
    transport,
    close: async () => {
      await client.close();
      await transport.close();
    },
  };
}
