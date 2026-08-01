import type { ConnectorSyncError, ConnectorSyncStatus } from "./types.js";

export class ConnectorStatusStore {
  private readonly statuses = new Map<string, ConnectorSyncStatus>();

  private key(userId: string, connector: string): string {
    return `${userId}:${connector}`;
  }

  get(userId: string, connector: string): ConnectorSyncStatus | undefined {
    return this.statuses.get(this.key(userId, connector));
  }

  listForUser(userId: string): ConnectorSyncStatus[] {
    return [...this.statuses.values()].filter((status) => status.userId === userId);
  }

  recordSuccess(
    userId: string,
    connector: string,
    nodesWritten: number,
    edgesWritten: number,
    syncedAt: string,
  ): ConnectorSyncStatus {
    const status: ConnectorSyncStatus = {
      connector,
      userId,
      lastSyncAt: syncedAt,
      lastSuccessAt: syncedAt,
      lastError: undefined,
      nodesWritten,
      edgesWritten,
    };
    this.statuses.set(this.key(userId, connector), status);
    return status;
  }

  recordFailure(
    userId: string,
    connector: string,
    error: ConnectorSyncError,
    syncedAt: string,
  ): ConnectorSyncStatus {
    const previous = this.get(userId, connector);
    const status: ConnectorSyncStatus = {
      connector,
      userId,
      lastSyncAt: syncedAt,
      lastSuccessAt: previous?.lastSuccessAt,
      lastError: error,
      nodesWritten: previous?.nodesWritten ?? 0,
      edgesWritten: previous?.edgesWritten ?? 0,
    };
    this.statuses.set(this.key(userId, connector), status);
    return status;
  }
  clear(): void {
    this.statuses.clear();
  }
}

export const connectorStatusStore = new ConnectorStatusStore();
