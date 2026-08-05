#!/usr/bin/env node

import { parseArgs } from "node:util";

import { BriefsClient } from "./client.js";
import { runActorsMe } from "./commands/actors.js";
import { runHealth } from "./commands/health.js";
import { runItems, UsageError } from "./commands/items.js";
import { runSmoke } from "./commands/smoke.js";
import { loadConfig } from "./config.js";
import { printError } from "./output.js";

const HELP = `briefs — CLI for the Briefs system API

Usage:
  briefs [global flags] <command> [subcommand] [options]

Global flags:
  --api-url <url>     API base URL (default: BRIEFS_API_URL or http://localhost:8001)
  --user-id <id>      X-Briefs-User-Id header (default: BRIEFS_USER_ID or demo)
  --json              Print JSON output
  --quiet             Suppress stderr messages
  -h, --help          Show help

Commands:
  health
  items list [--status <status>]
  items get <id>
  items create --name <name> [--kind <kind>] [--description <text>]
  items update <id> [--status <status>] [--name <name>] [--description <text>] [--lifecycle <lifecycle>]
  items activities <id>
  actors me
  smoke [--keep]
`;

type ParsedCli = ReturnType<typeof parseGlobalAndCommand>;

function parseGlobalAndCommand(argv: string[]) {
  const { values, tokens } = parseArgs({
    args: argv,
    options: {
      "api-url": { type: "string" },
      "user-id": { type: "string" },
      json: { type: "boolean", default: false },
      quiet: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      status: { type: "string" },
      name: { type: "string" },
      kind: { type: "string" },
      description: { type: "string" },
      lifecycle: { type: "string" },
      keep: { type: "boolean", default: false },
    },
    tokens: true,
    allowPositionals: true,
  });

  const positionals = tokens
    .filter((token): token is { kind: "positional"; index: number; value: string } => token.kind === "positional")
    .map((token) => token.value);

  const [command, subcommand, ...rest] = positionals;

  return {
    config: loadConfig({
      apiUrl: values["api-url"],
      userId: values["user-id"],
      json: values.json,
      quiet: values.quiet,
    }),
    help: values.help,
    command,
    subcommand,
    rest,
    flags: values,
  };
}

async function main(): Promise<number> {
  const parsed = parseGlobalAndCommand(process.argv.slice(2));

  if (parsed.help || !parsed.command) {
    console.log(HELP);
    return parsed.command ? 0 : 2;
  }

  const client = new BriefsClient(parsed.config);

  try {
    switch (parsed.command) {
      case "health":
        await runHealth(client, parsed.config);
        return 0;
      case "actors":
        if (parsed.subcommand !== "me") {
          throw new UsageError("usage: briefs actors me");
        }
        await runActorsMe(client, parsed.config);
        return 0;
      case "items":
        await runItems(client, parsed.config, {
          subcommand: parsed.subcommand,
          itemId: parsed.rest[0],
          status: parsed.flags.status,
          name: parsed.flags.name,
          kind: parsed.flags.kind,
          description: parsed.flags.description,
          lifecycle: parsed.flags.lifecycle,
        });
        return 0;
      case "smoke": {
        const result = await runSmoke(client, parsed.config, { keep: parsed.flags.keep });
        return result.ok ? 0 : 1;
      }
      default:
        throw new UsageError(`unknown command: ${parsed.command}`);
    }
  } catch (error) {
    if (error instanceof UsageError) {
      printError(parsed.config, error.message);
      printError(parsed.config, "\nRun briefs --help for usage.");
      return 2;
    }

    const message = error instanceof Error ? error.message : String(error);
    printError(parsed.config, message);
    return 1;
  }
}

const exitCode = await main();
process.exit(exitCode);
