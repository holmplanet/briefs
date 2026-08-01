import { getValidGoogleAccessToken } from "../../../auth/google.js";
import { getOAuthTokenStore } from "../../../auth/runtime.js";
import { GOOGLE_OAUTH_PROVIDER } from "../../../auth/types.js";
import type { GoogleConfig } from "../../../config.js";
import { ReadOnlyConnector } from "../../base.js";
import { ConnectorPack, type NormalizedSyncPayload } from "../../types.js";
import {
  createGoogleCalendarClientFactory,
  type GoogleCalendarClientFactory,
} from "./client.js";

export const GOOGLE_CALENDAR_CONNECTOR_NAME = "google-calendar";

export class GoogleCalendarConnector extends ReadOnlyConnector {
  readonly definition = {
    name: GOOGLE_CALENDAR_CONNECTOR_NAME,
    pack: ConnectorPack.PERSONAL,
    description: "Read upcoming events from Google Calendar",
    readOnly: true,
  };

  constructor(
    private readonly googleConfig: GoogleConfig,
    private readonly createClient: GoogleCalendarClientFactory = createGoogleCalendarClientFactory(
      googleConfig,
    ),
  ) {
    super();
  }

  protected override async assertReady(userId: string): Promise<void> {
    const tokens = await getOAuthTokenStore().get(userId, GOOGLE_OAUTH_PROVIDER);
    if (!tokens) {
      throw new Error(
        `Google Calendar not connected for ${userId}. Open /auth/google/start?userId=${encodeURIComponent(userId)}`,
      );
    }
  }

  async fetch(userId: string): Promise<NormalizedSyncPayload> {
    const accessToken = await getValidGoogleAccessToken(
      this.googleConfig,
      getOAuthTokenStore(),
      userId,
    );
    const client = this.createClient(accessToken);
    return client.listUpcomingEvents();
  }
}
