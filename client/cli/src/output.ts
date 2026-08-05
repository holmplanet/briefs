import type { CliConfig } from "./config.js";

export function printData(config: CliConfig, data: unknown): void {
  if (config.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (typeof data === "string") {
    console.log(data);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

export function printError(config: CliConfig, message: string): void {
  if (!config.quiet) {
    console.error(message);
  }
}

export function printTable(rows: Array<Record<string, string>>): void {
  if (rows.length === 0) {
    console.log("(empty)");
    return;
  }

  const columns = Object.keys(rows[0]!);
  const widths = columns.map((column) =>
    Math.max(column.length, ...rows.map((row) => (row[column] ?? "").length)),
  );

  console.log(columns.map((column, index) => column.padEnd(widths[index]!)).join("  "));
  console.log(widths.map((width) => "-".repeat(width)).join("  "));

  for (const row of rows) {
    console.log(columns.map((column, index) => (row[column] ?? "").padEnd(widths[index]!)).join("  "));
  }
}
