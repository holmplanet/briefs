import { ReadOnlyConnector } from "../../base.js";
import { ConnectorPack, type NormalizedSyncPayload } from "../../types.js";
import { getBriefTaskStore } from "../../../tasks/runtime.js";
import { mapBriefTasksToPayload } from "./map-tasks.js";

export const BRIEF_TASKS_CONNECTOR_NAME = "brief-tasks";

export class BriefTasksConnector extends ReadOnlyConnector {
  readonly definition = {
    name: BRIEF_TASKS_CONNECTOR_NAME,
    pack: ConnectorPack.PERSONAL,
    description: "Sync Brief-native tasks into the Event Graph",
    readOnly: false,
  };

  async fetch(userId: string): Promise<NormalizedSyncPayload> {
    const tasks = await getBriefTaskStore().listForUser(userId);
    return mapBriefTasksToPayload(tasks);
  }
}
