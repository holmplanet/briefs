import type { Connector } from "./base.js";

export class ConnectorRegistry {
  private readonly connectors = new Map<string, Connector>();

  register(connector: Connector): void {
    this.connectors.set(connector.name, connector);
  }

  get(name: string): Connector | undefined {
    return this.connectors.get(name);
  }

  list(): string[] {
    return [...this.connectors.keys()].sort();
  }
}

export const connectorRegistry = new ConnectorRegistry();
