import type { BriefsClient } from "../client.js";
import type { CliConfig } from "../config.js";
import { printData, printTable } from "../output.js";

export async function runActorsMe(client: BriefsClient, config: CliConfig): Promise<void> {
  const actor = await client.getActorMe();

  if (config.json) {
    printData(config, { actor });
    return;
  }

  console.log(`id:     ${actor.id}`);
  console.log(`type:   ${actor.type}`);
  console.log(`name:   ${actor.name}`);
}
