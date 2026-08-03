import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const baseUrl = process.env.BRIEF_PUBLIC_URL ?? "http://localhost:8000";
const userId = process.env.BRIEF_DOGFOOD_USER_ID ?? "carter";

async function main() {
  const client = new Client({ name: "try-tasks", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`));
  await client.connect(transport);

  const tools = await client.listTools();
  console.log(`\n=== MCP tools (${tools.tools.length}) ===`);
  console.log(tools.tools.map((tool) => tool.name).join(", "));

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(17, 0, 0, 0);

  console.log(`\n=== create_task (userId=${userId}) ===`);
  const created = await client.callTool({
    name: "create_task",
    arguments: {
      userId,
      label: "Try Brief tasks from Cursor",
      dueAt: yesterday.toISOString(),
      priority: "high",
      description: "Live dogfood from this session",
    },
  });
  console.log(JSON.stringify(created.structuredContent, null, 2));

  console.log(`\n=== brief_me ===`);
  const brief = await client.callTool({
    name: "brief_me",
    arguments: { userId, kind: "on_demand", syncFirst: false },
  });
  console.log(JSON.stringify(brief.structuredContent, null, 2));

  await client.close();
  await transport.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
