import { beforeEach, describe, expect, it } from "vitest";

import { BriefKind } from "../src/briefs/generator.js";
import { generateBrief, syncConnectors } from "../src/mcp/brief-service.js";
import {
  SMOKE_EVENT_LABEL,
  SMOKE_USER_ID,
  ingestSmokeGraph,
} from "./fixtures/smoke-connectors.js";
import { resetSmokeRuntime } from "./harness/smoke-harness.js";

describe("mcp brief service", () => {
  beforeEach(() => {
    resetSmokeRuntime();
  });

  it("ingests context and surfaces weather conflicts in brief_me", async () => {
    await ingestSmokeGraph(SMOKE_USER_ID);

    const reports = await syncConnectors(SMOKE_USER_ID);
    expect(reports).toHaveLength(1);
    expect(reports.every((report) => report.ok)).toBe(true);
    expect(reports[0]?.connector).toBe("brief-tasks");

    const brief = await generateBrief(SMOKE_USER_ID, BriefKind.ON_DEMAND, { syncFirst: false });
    expect(brief.bullets.some((bullet) => bullet.text.includes(SMOKE_EVENT_LABEL))).toBe(true);
    expect(brief.bullets.some((bullet) => bullet.text.toLowerCase().includes("weather"))).toBe(
      true,
    );
  });
});
