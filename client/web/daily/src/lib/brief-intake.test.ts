import { describe, expect, it } from "vitest";

import { buildBriefItemInput } from "./brief-intake";

describe("buildBriefItemInput", () => {
  it("maps guided human intake into the System item contract", () => {
    const input = buildBriefItemInput({
      kind: "project",
      name: "  Improve onboarding  ",
      outcome: "A new user reaches their first successful brief.",
      context: "Start with the MCP connection flow.",
    });

    expect(input).toEqual({
      name: "Improve onboarding",
      kind: "project",
      description: "Outcome\nA new user reaches their first successful brief.\n\nContext\nStart with the MCP connection flow.",
    });
  });

  it("defaults the kind and omits empty optional context", () => {
    const input = buildBriefItemInput({ name: "Capture idea", outcome: "Keep it available later." });

    expect(input).toEqual({
      name: "Capture idea",
      kind: "task",
      description: "Outcome\nKeep it available later.",
    });
  });

  it("rejects intake without a title or outcome", () => {
    expect(() => buildBriefItemInput({ name: " ", outcome: "Something" })).toThrow(
      "A title and outcome are required.",
    );
    expect(() => buildBriefItemInput({ name: "Something", outcome: " " })).toThrow(
      "A title and outcome are required.",
    );
  });
});
