import { describe, expect, it } from "vitest";

import { EdgeKind, NodeKind } from "../src/graph/models.js";
import { rowToEdge, rowToNode } from "../src/graph/postgres-store.js";

describe("postgres row mappers", () => {
  it("maps node rows", () => {
    const node = rowToNode({
      id: "11111111-1111-1111-1111-111111111111",
      user_id: "user-1",
      kind: NodeKind.EVENT,
      label: "Standup",
      data: { location: "Zoom" },
      starts_at: new Date("2026-08-01T14:00:00.000Z"),
      ends_at: new Date("2026-08-01T14:30:00.000Z"),
      updated_at: new Date("2026-08-01T13:00:00.000Z"),
    });

    expect(node.userId).toBe("user-1");
    expect(node.kind).toBe(NodeKind.EVENT);
    expect(node.data.location).toBe("Zoom");
  });

  it("maps edge rows", () => {
    const edge = rowToEdge({
      id: "22222222-2222-2222-2222-222222222222",
      user_id: "user-1",
      kind: EdgeKind.DEPENDS_ON,
      source_id: "11111111-1111-1111-1111-111111111111",
      target_id: "33333333-3333-3333-3333-333333333333",
      data: {},
      updated_at: new Date("2026-08-01T13:00:00.000Z"),
    });

    expect(edge.kind).toBe(EdgeKind.DEPENDS_ON);
    expect(edge.sourceId).toBe("11111111-1111-1111-1111-111111111111");
  });
});
