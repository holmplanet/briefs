import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { briefStore } from "../../src/briefs/store.js";
import { BriefKind } from "../../src/briefs/generator.js";
import { getConnectorRegistry } from "../../src/connectors/runtime.js";
import { getGraphStore } from "../../src/graph/runtime.js";
import { EdgeKind, NodeKind } from "../../src/graph/models.js";
import { generateBrief, generateDeltaBrief, syncConnectors } from "../../src/mcp/brief-service.js";
import {
  SMOKE_EVENT_LABEL,
  SMOKE_USER_ID,
  expectSmokeGraphShape,
} from "../fixtures/smoke-connectors.js";
import { resetSmokeRuntime, startSmokeServer } from "../harness/smoke-harness.js";

type BriefToolResult = {
  userId: string;
  kind: string;
  generatedAt: string;
  greeting: string;
  bullets: Array<{ text: string; priority: number }>;
};

type SyncToolResult = {
  userId: string;
  reports: Array<{ connector: string; ok: boolean }>;
};

function readStructuredContent<T>(result: {
  structuredContent?: unknown;
  content: Array<{ type: string; text?: string }>;
}): T {
  if (result.structuredContent && typeof result.structuredContent === "object") {
    return result.structuredContent as T;
  }

  const text = result.content.find((item) => item.type === "text")?.text;
  if (text) {
    return JSON.parse(text) as T;
  }

  throw new Error("Expected structured MCP tool content");
}

describe("v0 smoke test", () => {
  beforeEach(() => {
    resetSmokeRuntime();
  });

  it("runs calendar → weather sync → brief with a weather conflict bullet", async () => {
    const reports = await syncConnectors(SMOKE_USER_ID);
    expect(reports).toHaveLength(2);
    expect(reports.every((report) => report.ok)).toBe(true);
    expect(getConnectorRegistry().listNames()).toEqual(["google-calendar", "weather"]);

    const snapshot = await getGraphStore().getSnapshot(SMOKE_USER_ID);
    expectSmokeGraphShape(snapshot);
    expect(snapshot.nodes.filter((node) => node.kind === NodeKind.EVENT)).toHaveLength(1);
    expect(snapshot.nodes.filter((node) => node.kind === NodeKind.WEATHER)).toHaveLength(1);
    expect(snapshot.edges.filter((edge) => edge.kind === EdgeKind.DEPENDS_ON)).toHaveLength(1);

    const brief = await generateBrief(SMOKE_USER_ID, BriefKind.ON_DEMAND, { syncFirst: false });
    expect(brief.bullets.length).toBeGreaterThan(0);
    expect(brief.bullets.some((bullet) => bullet.text.includes(SMOKE_EVENT_LABEL))).toBe(true);
    expect(brief.bullets.some((bullet) => bullet.text.toLowerCase().includes("weather"))).toBe(
      true,
    );

    const delta = await generateDeltaBrief(SMOKE_USER_ID);
    expect(delta.brief.bullets[0]?.text).toContain("No new changes");
    expect(briefStore.getChangeSet(SMOKE_USER_ID)?.insights.length).toBeGreaterThan(0);
  });

  describe("MCP HTTP transport", () => {
    let closeServer: (() => Promise<void>) | undefined;
    let client: Client | undefined;
    let transport: StreamableHTTPClientTransport | undefined;

    afterEach(async () => {
      await client?.close();
      await transport?.close();
      await closeServer?.();
      client = undefined;
      transport = undefined;
      closeServer = undefined;
    });

    it("exposes sync_connectors and brief_me over streamable HTTP", async () => {
      const server = await startSmokeServer();
      closeServer = server.close;

      client = new Client({ name: "brief-smoke-test", version: "0.1.0" });
      transport = new StreamableHTTPClientTransport(
        new URL(`http://127.0.0.1:${server.port}${server.config.mcpPath}`),
      );
      await client.connect(transport);

      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toEqual(
        expect.arrayContaining([
          "sync_connectors",
          "brief_me",
          "what_changed",
          "get_context",
          "propose_action",
          "list_actions",
          "approve_action",
        ]),
      );

      const syncResult = await client.callTool({
        name: "sync_connectors",
        arguments: { userId: SMOKE_USER_ID },
      });
      const syncPayload = readStructuredContent<SyncToolResult>(syncResult);
      expect(syncPayload.reports).toHaveLength(2);
      expect(syncPayload.reports.every((report) => report.ok)).toBe(true);

      const briefResult = await client.callTool({
        name: "brief_me",
        arguments: {
          userId: SMOKE_USER_ID,
          kind: BriefKind.ON_DEMAND,
          syncFirst: false,
        },
      });
      const brief = readStructuredContent<BriefToolResult>(briefResult);
      expect(brief.bullets.some((bullet) => bullet.text.includes(SMOKE_EVENT_LABEL))).toBe(true);
      expect(brief.bullets.some((bullet) => bullet.text.toLowerCase().includes("weather"))).toBe(
        true,
      );

      const deltaResult = await client.callTool({
        name: "what_changed",
        arguments: { userId: SMOKE_USER_ID },
      });
      const deltaPayload = readStructuredContent<{
        brief: BriefToolResult;
        previousBriefAt?: string;
      }>(deltaResult);
      expect(deltaPayload.previousBriefAt).toBeDefined();
      expect(deltaPayload.brief.bullets[0]?.text).toContain("No new changes");

      const proposeResult = await client.callTool({
        name: "propose_action",
        arguments: {
          userId: SMOKE_USER_ID,
          actionType: "draft_reschedule",
          summary: "Move outdoor standup due to weather",
          payload: {
            eventLabel: SMOKE_EVENT_LABEL,
            newStart: "2026-08-02T15:00:00.000Z",
            newEnd: "2026-08-02T15:30:00.000Z",
          },
        },
      });
      const proposal = readStructuredContent<{ id: string; status: string }>(proposeResult);
      expect(proposal.status).toBe("proposed");

      const approveResult = await client.callTool({
        name: "approve_action",
        arguments: { userId: SMOKE_USER_ID, actionId: proposal.id },
      });
      const approval = readStructuredContent<{ status: string; result?: { mode: string } }>(
        approveResult,
      );
      expect(approval.status).toBe("executed");
      expect(approval.result?.mode).toBe("draft");
    });
  });
});
