import type { GraphStore } from "../graph/store.interface.js";
import { connectorStatusStore } from "./status.js";
import type {
  Connector,
  ConnectorHealth,
  ConnectorSyncError,
  ConnectorSyncReport,
  ConnectorSyncStatus,
} from "./types.js";

function toSyncError(error: unknown): ConnectorSyncError {
  if (error instanceof Error) {
    return {
      message: error.message,
      cause: error.cause ? String(error.cause) : undefined,
    };
  }
  return { message: String(error) };
}

export class ConnectorRunner {
  constructor(private readonly graphStore: GraphStore) {}

  async syncConnector(userId: string, connector: Connector): Promise<ConnectorSyncReport> {
    const syncedAt = new Date().toISOString();
    const name = connector.definition.name;

    try {
      const result = await connector.sync(userId);

      for (const node of result.nodes) {
        await this.graphStore.upsertNode(node);
      }
      for (const edge of result.edges) {
        await this.graphStore.upsertEdge(edge);
      }

      connectorStatusStore.recordSuccess(
        userId,
        name,
        result.nodes.length,
        result.edges.length,
        result.syncedAt,
      );

      return {
        connector: name,
        userId,
        ok: true,
        syncedAt: result.syncedAt,
        nodesWritten: result.nodes.length,
        edgesWritten: result.edges.length,
      };
    } catch (error) {
      const syncError = toSyncError(error);
      connectorStatusStore.recordFailure(userId, name, syncError, syncedAt);
      return {
        connector: name,
        userId,
        ok: false,
        syncedAt,
        nodesWritten: 0,
        edgesWritten: 0,
        error: syncError,
      };
    }
  }

  async healthCheck(userId: string, connector: Connector): Promise<ConnectorHealth> {
    return connector.health(userId);
  }
}

export function getConnectorStatus(userId: string, connector: string): ConnectorSyncStatus | undefined {
  return connectorStatusStore.get(userId, connector);
}
