import { NodeKind } from "../../../graph/models.js";
import type { NormalizedNodeInput, NormalizedSyncPayload } from "../../types.js";

export type GoogleCalendarEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
};

export type GoogleCalendarListResponse = {
  items?: GoogleCalendarEvent[];
};

export function mapCalendarEvents(events: GoogleCalendarEvent[]): NormalizedSyncPayload {
  const nodes: NormalizedNodeInput[] = events
    .filter((event) => event.id)
    .map((event) => ({
      externalId: event.id,
      kind: NodeKind.EVENT,
      label: event.summary?.trim() || "Untitled event",
      startsAt: event.start?.dateTime ?? toAllDayStart(event.start?.date),
      endsAt: event.end?.dateTime ?? toAllDayEnd(event.end?.date),
      data: {
        status: event.status,
        description: event.description,
        location: event.location,
        htmlLink: event.htmlLink,
        source: "google-calendar",
        allDay: Boolean(event.start?.date && !event.start?.dateTime),
      },
    }));

  return { nodes, edges: [] };
}

function toAllDayStart(date?: string): string | undefined {
  return date ? `${date}T00:00:00.000Z` : undefined;
}

function toAllDayEnd(date?: string): string | undefined {
  return date ? `${date}T23:59:59.999Z` : undefined;
}
