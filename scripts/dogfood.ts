import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const baseUrl = process.env.BRIEF_PUBLIC_URL ?? "http://localhost:8000";
const userId = process.env.BRIEF_DOGFOOD_USER_ID ?? "carter";
const mcpPath = process.env.BRIEF_MCP_PATH ?? "/mcp";
const authToken = process.env.BRIEF_DOGFOOD_TOKEN;

function readPayload(result: {
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}): unknown {
  if (result.structuredContent && typeof result.structuredContent === "object") {
    return result.structuredContent;
  }
  const text = result.content.find((item) => item.type === "text")?.text;
  return text ? JSON.parse(text) : result;
}

async function main() {
  const health = await fetch(`${baseUrl}/health`);
  console.log(`\n=== health (${health.status}) ===`);
  console.log(JSON.stringify(await health.json(), null, 2));

  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const client = new Client({ name: "brief-dogfood", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}${mcpPath}`), {
    requestInit: { headers },
  });

  await client.connect(transport);
  const tools = await client.listTools();
  console.log(`\n=== MCP tools (${tools.tools.length}) ===`);
  console.log(tools.tools.map((tool) => tool.name).join(", "));

  console.log(`\n=== sync_connectors (userId=${userId}) ===`);
  const sync = await client.callTool({
    name: "sync_connectors",
    arguments: { userId },
  });
  console.log(JSON.stringify(readPayload(sync), null, 2));

  console.log(`\n=== brief_me ===`);
  const brief = await client.callTool({
    name: "brief_me",
    arguments: { userId, kind: "on_demand", syncFirst: false },
  });
  console.log(JSON.stringify(readPayload(brief), null, 2));

  console.log(`\n=== what_changed ===`);
  const delta = await client.callTool({
    name: "what_changed",
    arguments: { userId },
  });
  console.log(JSON.stringify(readPayload(delta), null, 2));

  console.log(`\n=== get_context ===`);
  const context = await client.callTool({
    name: "get_context",
    arguments: { userId },
  });
  const contextPayload = readPayload(context) as { nodeCount?: number; edgeCount?: number };
  console.log(
    JSON.stringify(
      {
        nodeCount: contextPayload.nodeCount,
        edgeCount: contextPayload.edgeCount,
      },
      null,
      2,
    ),
  );

  await client.close();
  await transport.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
