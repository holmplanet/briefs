import { randomUUID } from "node:crypto";

import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPostgresPool, initGraphSchema } from "../src/db/postgres.js";
import { EdgeKind, NodeKind } from "../src/graph/models.js";
import { PostgresGraphStore } from "../src/graph/postgres-store.js";

const databaseUrl = process.env.BRIEF_DATABASE_URL;

describe.skipIf(!databaseUrl)("PostgresGraphStore integration", () => {
  let pool: Pool;
  let store: PostgresGraphStore;
  const userId = `test-${randomUUID()}`;

  beforeAll(async () => {
    pool = createPostgresPool({ connectionString: databaseUrl! });
    await initGraphSchema(pool);
    store = new PostgresGraphStore(pool);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM graph_edges WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM graph_nodes WHERE user_id = $1", [userId]);
    await store.close();
  });

  it("isolates graph data per user", async () => {
    const nodeId = randomUUID();
    const weatherId = randomUUID();

    await store.upsertNode({
      id: nodeId,
      userId,
      kind: NodeKind.EVENT,
      label: "Afternoon meeting",
      data: {},
      startsAt: "2026-08-01T14:00:00.000Z",
      updatedAt: new Date().toISOString(),
    });

    await store.upsertNode({
      id: weatherId,
      userId,
      kind: NodeKind.WEATHER,
      label: "Storm front",
      data: { severity: "high" },
      updatedAt: new Date().toISOString(),
    });

    await store.upsertEdge({
      id: randomUUID(),
      userId,
      kind: EdgeKind.DEPENDS_ON,
      sourceId: nodeId,
      targetId: weatherId,
      data: {},
      updatedAt: new Date().toISOString(),
    });

    const snapshot = await store.getSnapshot(userId);
    expect(snapshot.nodes).toHaveLength(2);
    expect(snapshot.edges).toHaveLength(1);

    const otherUserSnapshot = await store.getSnapshot("someone-else");
    expect(otherUserSnapshot.nodes).toHaveLength(0);
    expect(otherUserSnapshot.edges).toHaveLength(0);
  });
});
