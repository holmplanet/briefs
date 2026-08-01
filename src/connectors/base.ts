import { mapPayloadToGraph } from "./types.js";
import type {
  Connector,
  ConnectorDefinition,
  ConnectorHealth,
  ConnectorSyncResult,
  NormalizedSyncPayload,
} from "./types.js";

export abstract class ReadOnlyConnector implements Connector {
  abstract readonly definition: ConnectorDefinition;

  async health(userId: string): Promise<ConnectorHealth> {
    try {
      await this.assertReady(userId);
      return {
        ok: true,
        name: this.definition.name,
      };
    } catch (error) {
      return {
        ok: false,
        name: this.definition.name,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  abstract fetch(userId: string): Promise<NormalizedSyncPayload>;

  async sync(userId: string): Promise<ConnectorSyncResult> {
    const payload = await this.fetch(userId);
    return mapPayloadToGraph(userId, this.definition.name, payload);
  }

  protected async assertReady(_userId: string): Promise<void> {
    return;
  }
}
