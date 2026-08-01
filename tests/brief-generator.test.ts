import { describe, expect, it } from "vitest";

import { BriefKind, briefGenerator } from "../src/briefs/generator.js";
import { reasoningEngine } from "../src/reasoning/engine.js";

describe("brief generator", () => {
  it("returns a helpful bullet when the graph is empty", () => {
    const changes = reasoningEngine.analyze({
      userId: "test-user",
      nodes: [],
      edges: [],
      syncedAt: new Date().toISOString(),
    });
    const brief = briefGenerator.generate("test-user", BriefKind.ON_DEMAND, changes);

    expect(brief.greeting).toBe("Here's your brief.");
    expect(brief.bullets).toHaveLength(1);
    expect(brief.bullets[0]?.text).toContain("Connect a calendar");
  });
});
