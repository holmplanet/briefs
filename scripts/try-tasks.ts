import { createMcpClient, readMcpPayload } from "./lib/mcp-client.js";

const userId = process.env.BRIEF_DOGFOOD_USER_ID ?? "carter";

async function main() {
  const { client, close } = await createMcpClient({
    clientName: "try-tasks",
  });

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
  console.log(JSON.stringify(readMcpPayload(created), null, 2));

  console.log(`\n=== brief_me ===`);
  const brief = await client.callTool({
    name: "brief_me",
    arguments: { userId, kind: "on_demand", syncFirst: true },
  });
  console.log(JSON.stringify(readMcpPayload(brief), null, 2));

  await close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
