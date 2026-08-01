import type { GoogleConfig } from "../../../config.js";
import {
  type GoogleCalendarListResponse,
  mapCalendarEvents,
} from "./map-events.js";

export type GoogleCalendarClientOptions = {
  accessToken: string;
  lookaheadDays: number;
  fetchImpl?: typeof fetch;
};

export class GoogleCalendarClient {
  constructor(private readonly options: GoogleCalendarClientOptions) {}

  async listUpcomingEvents(): Promise<ReturnType<typeof mapCalendarEvents>> {
    const timeMin = new Date().toISOString();
    const timeMax = new Date(
      Date.now() + this.options.lookaheadDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "100",
    });

    const fetchImpl = this.options.fetchImpl ?? fetch;
    const response = await fetchImpl(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          authorization: `Bearer ${this.options.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Google Calendar API failed (${response.status}): ${detail.slice(0, 240)}`);
    }

    const payload = (await response.json()) as GoogleCalendarListResponse;
    return mapCalendarEvents(payload.items ?? []);
  }
}

export type GoogleCalendarClientFactory = (
  accessToken: string,
) => GoogleCalendarClient;

export function createGoogleCalendarClientFactory(
  config: GoogleConfig,
  fetchImpl?: typeof fetch,
): GoogleCalendarClientFactory {
  return (accessToken: string) =>
    new GoogleCalendarClient({
      accessToken,
      lookaheadDays: config.lookaheadDays,
      fetchImpl,
    });
}
