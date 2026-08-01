import type { ConnectorRunner } from "./runner.js";
import { ConnectorRunner as ConnectorRunnerImpl } from "./runner.js";
import { connectorStatusStore } from "./status.js";
import type {
  Connector,
  ConnectorHealth,
  ConnectorSyncReport,
  ConnectorSyncStatus,
} from "./types.js";

export class ConnectorRegistry {
  private readonly connectors = new Map<string, Connector>();
  private runner: ConnectorRunner | null = null;

  register(connector: Connector): void {
    if (this.connectors.has(connector.definition.name)) {
      throw new Error(`Connector already registered: ${connector.definition.name}`);
    }
    this.connectors.set(connector.definition.name, connector);
  }

  unregister(name: string): boolean {
    return this.connectors.delete(name);
  }

  get(name: string): Connector | undefined {
    return this.connectors.get(name);
  }

  list(): Connector[] {
    return [...this.connectors.values()].sort((a, b) =>
      a.definition.name.localeCompare(b.definition.name),
    );
  }

  listNames(): string[] {
    return this.list().map((connector) => connector.definition.name);
  }

  bindRunner(runner: ConnectorRunner): void {
    this.runner = runner;
  }

  private requireRunner(): ConnectorRunner {
    if (!this.runner) {
      throw new Error("Connector runner is not initialized");
    }
    return this.runner;
  }

  async sync(userId: string, connectorName: string): Promise<ConnectorSyncReport> {
    const connector = this.get(connectorName);
    if (!connector) {
      throw new Error(`Unknown connector: ${connectorName}`);
    }
    return this.requireRunner().syncConnector(userId, connector);
  }

  async syncAll(userId: string): Promise<ConnectorSyncReport[]> {
    const reports: ConnectorSyncReport[] = [];
    for (const connector of this.list()) {
      reports.push(await this.sync(userId, connector.definition.name));
    }
    return reports;
  }

  async health(userId: string, connectorName?: string): Promise<ConnectorHealth[]> {
    const targets = connectorName
      ? [this.get(connectorName)].filter((connector): connector is Connector => connector !== undefined)
      : this.list();

    if (connectorName && targets.length === 0) {
      throw new Error(`Unknown connector: ${connectorName}`);
    }

    const runner = this.requireRunner();
    return Promise.all(targets.map((connector) => runner.healthCheck(userId, connector)));
  }

  statuses(userId: string): ConnectorSyncStatus[] {
    return connectorStatusStore.listForUser(userId);
  }
}

export function createConnectorRegistry(runner: ConnectorRunner): ConnectorRegistry {
  const registry = new ConnectorRegistry();
  registry.bindRunner(runner);
  return registry;
}
