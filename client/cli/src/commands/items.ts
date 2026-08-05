import type { ItemCreateInput, ItemUpdateInput } from "@briefs/shared/item";

import type { BriefsClient } from "../client.js";
import type { CliConfig } from "../config.js";
import { printData, printTable } from "../output.js";

type ItemsCommandArgs = {
  subcommand?: string;
  itemId?: string;
  status?: string;
  name?: string;
  kind?: string;
  description?: string;
  lifecycle?: string;
};

export async function runItems(
  client: BriefsClient,
  config: CliConfig,
  args: ItemsCommandArgs,
): Promise<void> {
  switch (args.subcommand) {
    case "list":
      await listItems(client, config, args.status);
      return;
    case "get":
      if (!args.itemId) {
        throw new UsageError("items get requires an item id");
      }
      await getItem(client, config, args.itemId);
      return;
    case "create":
      await createItem(client, config, args);
      return;
    case "update":
      if (!args.itemId) {
        throw new UsageError("items update requires an item id");
      }
      await updateItem(client, config, args.itemId, args);
      return;
    case "activities":
      if (!args.itemId) {
        throw new UsageError("items activities requires an item id");
      }
      await listActivities(client, config, args.itemId);
      return;
    default:
      throw new UsageError(
        "usage: briefs items <list|get|create|update|activities> [options]",
      );
  }
}

async function listItems(client: BriefsClient, config: CliConfig, status?: string): Promise<void> {
  const items = await client.listItems(status);

  if (config.json) {
    printData(config, { items });
    return;
  }

  if (items.length === 0) {
    console.log("No items.");
    return;
  }

  printTable(
    items.map((item) => ({
      id: item.id,
      name: item.name,
      kind: item.kind,
      status: item.status,
      updated: item.updatedAt,
    })),
  );
}

async function getItem(client: BriefsClient, config: CliConfig, itemId: string): Promise<void> {
  const item = await client.getItem(itemId);
  printData(config, config.json ? { item } : item);
}

async function createItem(
  client: BriefsClient,
  config: CliConfig,
  args: ItemsCommandArgs,
): Promise<void> {
  if (!args.name) {
    throw new UsageError("items create requires --name");
  }

  const input: ItemCreateInput = {
    name: args.name,
    kind: args.kind,
    description: args.description,
  };

  const item = await client.createItem(input);
  printData(config, config.json ? { item } : item);
}

async function updateItem(
  client: BriefsClient,
  config: CliConfig,
  itemId: string,
  args: ItemsCommandArgs,
): Promise<void> {
  const input: ItemUpdateInput = {};

  if (args.status) {
    input.status = args.status as ItemUpdateInput["status"];
  }
  if (args.name) {
    input.name = args.name;
  }
  if (args.description !== undefined) {
    input.description = args.description;
  }
  if (args.lifecycle) {
    input.lifecycle = args.lifecycle as ItemUpdateInput["lifecycle"];
  }

  if (Object.keys(input).length === 0) {
    throw new UsageError("items update requires at least one of --status, --name, --description, --lifecycle");
  }

  const item = await client.updateItem(itemId, input);
  printData(config, config.json ? { item } : item);
}

async function listActivities(
  client: BriefsClient,
  config: CliConfig,
  itemId: string,
): Promise<void> {
  const activities = await client.listItemActivities(itemId);
  printData(config, config.json ? { activities } : activities);
}

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}
