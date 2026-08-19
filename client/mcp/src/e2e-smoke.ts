import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

type SmokeStep = {
  name: string;
  ok: boolean;
  ms: number;
  detail?: string;
};

const apiUrl = (process.env.API_URL ?? "http://localhost:8001").replace(/\/$/, "");
const mcpUrl = process.env.MCP_URL ?? "http://localhost:3334/mcp";
const dailyUrl = (process.env.DAILY_URL ?? "http://localhost:3000").replace(/\/$/, "");
const userId = process.env.USER_ID ?? "demo";
const keepItem = process.env.E2E_KEEP === "true";

const steps: SmokeStep[] = [];

async function runStep(name: string, action: () => Promise<string>): Promise<string | undefined> {
  const started = Date.now();
  try {
    const detail = await action();
    steps.push({ name, ok: true, ms: Date.now() - started, detail });
    return detail;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    steps.push({ name, ok: false, ms: Date.now() - started, detail });
    return undefined;
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "X-Briefs-User-Id": userId,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${body}`);
  }
  return JSON.parse(body) as T;
}

function toolData<T>(result: unknown): T {
  const response = result as { isError?: boolean; structuredContent?: unknown };
  if (response.isError) {
    throw new Error(JSON.stringify(response.structuredContent ?? "MCP tool failed"));
  }

  const envelope = response.structuredContent as { data?: T; error?: string } | undefined;
  if (!envelope?.data || envelope.error) {
    throw new Error(envelope?.error ?? "MCP tool returned no data");
  }
  return envelope.data;
}

async function main(): Promise<void> {
  let itemId: string | undefined;
  let transport: StreamableHTTPClientTransport | undefined;

  try {
    await runStep("api_health", async () => {
      const health = await fetchJson<{ status: string; service: string }>(`${apiUrl}/health`);
      if (health.status !== "ok" || health.service !== "holmplanet-briefs") {
        throw new Error(`unexpected API health: ${JSON.stringify(health)}`);
      }
      return health.service;
    });

    await runStep("mcp_health", async () => {
      const health = await fetchJson<{ status: string; service: string }>(
        `${new URL("/health", mcpUrl).toString()}`,
      );
      if (health.status !== "ok" || health.service !== "briefs-mcp") {
        throw new Error(`unexpected MCP health: ${JSON.stringify(health)}`);
      }
      return health.service;
    });

    const client = new Client({ name: "briefs-e2e-smoke", version: "0.1.0" });
    transport = new StreamableHTTPClientTransport(new URL(mcpUrl));
    await runStep("mcp_initialize", async () => {
      await client.connect(transport!);
      return "connected";
    });

    const itemName = `E2E calendar smoke ${new Date().toISOString()}`;
    const externalId = `event-${Date.now()}`;
    const contextNode = {
      externalId,
      kind: "event",
      name: itemName,
      startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      location: "Smoke test",
    };
    await runStep("mcp_ingest_context", async () => {
      const result = await client.callTool({
        name: "ingest_context",
        arguments: {
          source: "e2e-calendar",
          nodes: [contextNode],
        },
      });
      const data = toolData<{ items: Array<{ id: string; name: string }> }>(result);
      itemId = data.items[0]?.id;
      if (!itemId || data.items[0]?.name !== itemName) throw new Error("MCP returned the wrong context item");
      return itemId;
    });

    await runStep("mcp_ingest_dedupe", async () => {
      const result = await client.callTool({
        name: "ingest_context",
        arguments: { source: "e2e-calendar", nodes: [contextNode] },
      });
      const data = toolData<{ items: Array<{ id: string }> }>(result);
      if (data.items[0]?.id !== itemId) throw new Error("Repeated context created a duplicate item");
      return itemId!;
    });

    await runStep("api_item_round_trip", async () => {
      if (!itemId) throw new Error("missing item id");
      const data = await fetchJson<{ item: { id: string; name: string } }>(
        `${apiUrl}/api/v1/items/${itemId}`,
      );
      if (data.item.id !== itemId || data.item.name !== itemName) {
        throw new Error("API item did not match MCP-created item");
      }
      return itemId;
    });

    await runStep("api_activity_created", async () => {
      if (!itemId) throw new Error("missing item id");
      const data = await fetchJson<{ activities: unknown[] }>(
        `${apiUrl}/api/v1/items/${itemId}/activities`,
      );
      if (data.activities.length < 1) throw new Error("expected a create activity");
      return `${data.activities.length} activities`;
    });

    await runStep("daily_item_visible", async () => {
      if (!itemId) throw new Error("missing item id");
      const response = await fetch(`${dailyUrl}/items/${itemId}`);
      const body = await response.text();
      if (!response.ok || !body.includes(itemName)) {
        throw new Error(`Daily did not render the item (${response.status})`);
      }
      return `${dailyUrl}/items/${itemId}`;
    });

    await runStep("mcp_brief_me", async () => {
      const result = await client.callTool({
        name: "brief_me",
        arguments: { kind: "morning" },
      });
      const data = toolData<{ brief: { kind: string; itemIds: string[] } }>(result);
      if (data.brief.kind !== "morning" || !data.brief.itemIds.includes(itemId!)) {
        throw new Error("Brief did not include the ingested event");
      }
      return data.brief.itemIds.join(", ");
    });

    if (!keepItem && itemId) {
      await runStep("mcp_items_archive", async () => {
        const result = await client.callTool({
          name: "items_update",
          arguments: { item_id: itemId, lifecycle: "archived" },
        });
        toolData(result);
        return itemId!;
      });
    }
  } finally {
    await transport?.close();
  }

  for (const step of steps) {
    console.log(`${step.ok ? "ok" : "FAIL"} ${step.name} (${step.ms}ms)${step.detail ? ` — ${step.detail}` : ""}`);
  }

  if (steps.some((step) => !step.ok)) {
    process.exitCode = 1;
  } else {
    console.log("E2E smoke passed.");
  }
}

await main();
