import type { BriefsClient } from "../client.js";
import type { CliConfig } from "../config.js";
import { printData } from "../output.js";

export async function runHealth(client: BriefsClient, config: CliConfig): Promise<void> {
  const health = await client.health();

  if (config.json) {
    printData(config, health);
    return;
  }

  console.log(`status:  ${health.status}`);
  console.log(`service: ${health.service}`);
  if (health.storage) {
    console.log(`storage: ${health.storage}`);
  }
}
