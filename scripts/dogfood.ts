import {
  buildStaticSmokeWeatherIngestArgs,
  smokeCalendarIngestArgs,
} from "../tests/fixtures/smoke-connectors.js";
import { createMcpClient, readMcpPayload } from "./lib/mcp-client.js";

const baseUrl = process.env.BRIEF_PUBLIC_URL ?? "http://localhost:8000";
const userId = process.env.BRIEF_DOGFOOD_USER_ID ?? "carter";

async function main() {
  const health = await fetch(`${baseUrl}/health`);
  console.log(`\n=== health (${health.status}) ===`);
  console.log(JSON.stringify(await health.json(), null, 2));

  const { client, close } = await createMcpClient({
    clientName: "brief-dogfood",
  });

  const tools = await client.listTools();
  console.log(`\n=== MCP tools (${tools.tools.length}) ===`);
  console.log(tools.tools.map((tool) => tool.name).join(", "));

  console.log(`\n=== ingest_context: calendar (userId=${userId}) ===`);
  const calendarIngest = await client.callTool({
    name: "ingest_context",
    arguments: { userId, ...smokeCalendarIngestArgs },
  });
  console.log(JSON.stringify(readMcpPayload(calendarIngest), null, 2));

  console.log(`\n=== ingest_context: weather ===`);
  const weatherIngest = await client.callTool({
    name: "ingest_context",
    arguments: { userId, ...buildStaticSmokeWeatherIngestArgs() },
  });
  console.log(JSON.stringify(readMcpPayload(weatherIngest), null, 2));

  console.log(`\n=== sync_connectors ===`);
  const sync = await client.callTool({
    name: "sync_connectors",
    arguments: { userId },
  });
  console.log(JSON.stringify(readMcpPayload(sync), null, 2));

  console.log(`\n=== brief_me ===`);
  const brief = await client.callTool({
    name: "brief_me",
    arguments: { userId, kind: "on_demand", syncFirst: false },
  });
  console.log(JSON.stringify(readMcpPayload(brief), null, 2));

  console.log(`\n=== what_changed ===`);
  const delta = await client.callTool({
    name: "what_changed",
    arguments: { userId },
  });
  console.log(JSON.stringify(readMcpPayload(delta), null, 2));

  console.log(`\n=== get_context ===`);
  const context = await client.callTool({
    name: "get_context",
    arguments: { userId },
  });
  const contextPayload = readMcpPayload(context) as { nodeCount?: number; edgeCount?: number };
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

  await close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
