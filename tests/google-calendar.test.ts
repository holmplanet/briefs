import { describe, expect, it } from "vitest";

import { NodeKind } from "../src/graph/models.js";
import { mapCalendarEvents } from "../src/connectors/personal/google-calendar/map-events.js";
import { GoogleCalendarClient } from "../src/connectors/personal/google-calendar/client.js";
import { GoogleCalendarConnector } from "../src/connectors/personal/google-calendar/connector.js";
import { InMemoryOAuthTokenStore } from "../src/auth/memory-token-store.js";
import { GOOGLE_OAUTH_PROVIDER } from "../src/auth/types.js";
import type { GoogleConfig } from "../src/config.js";

const googleConfig: GoogleConfig = {
  clientId: "client-id",
  clientSecret: "client-secret",
  redirectUri: "http://localhost:8000/auth/google/callback",
  scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  lookaheadDays: 7,
};

describe("google calendar connector", () => {
  it("maps API events into normalized graph nodes", () => {
    const payload = mapCalendarEvents([
      {
        id: "evt-1",
        summary: "Product sync",
        start: { dateTime: "2026-08-01T15:00:00Z" },
        end: { dateTime: "2026-08-01T15:30:00Z" },
        location: "Zoom",
      },
      {
        id: "evt-2",
        summary: "All day offsite",
        start: { date: "2026-08-02" },
        end: { date: "2026-08-02" },
      },
    ]);

    expect(payload.nodes).toHaveLength(2);
    expect(payload.nodes[0]).toMatchObject({
      externalId: "evt-1",
      kind: NodeKind.EVENT,
      label: "Product sync",
    });
    expect(payload.nodes[1]?.data.allDay).toBe(true);
  });

  it("fetches upcoming events with a bearer token", async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          items: [
            {
              id: "evt-3",
              summary: "Demo",
              start: { dateTime: "2026-08-01T16:00:00Z" },
              end: { dateTime: "2026-08-01T17:00:00Z" },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );

    const client = new GoogleCalendarClient({
      accessToken: "token-123",
      lookaheadDays: 7,
      fetchImpl,
    });

    const payload = await client.listUpcomingEvents();
    expect(payload.nodes).toHaveLength(1);
    expect(payload.nodes[0]?.label).toBe("Demo");
  });

  it("syncs events when the user has connected Google Calendar", async () => {
    const tokenStore = new InMemoryOAuthTokenStore();
    await tokenStore.save({
      userId: "user-1",
      provider: GOOGLE_OAUTH_PROVIDER,
      accessToken: "token-123",
      scopes: googleConfig.scopes,
    });

    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("oauth2.googleapis.com/token")) {
        return new Response(JSON.stringify({ access_token: "token-123", expires_in: 3600 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          items: [
            {
              id: "evt-4",
              summary: "Brief review",
              start: { dateTime: "2026-08-01T18:00:00Z" },
              end: { dateTime: "2026-08-01T18:30:00Z" },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const connector = new GoogleCalendarConnector(googleConfig, (accessToken) =>
      new GoogleCalendarClient({ accessToken, lookaheadDays: 7, fetchImpl }),
    );

    const { setOAuthTokenStore } = await import("../src/auth/runtime.js");
    setOAuthTokenStore(tokenStore);

    const result = await connector.fetch("user-1");
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]?.label).toBe("Brief review");
  });
});
