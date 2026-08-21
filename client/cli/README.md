# `@briefs/cli`

Command-line client for the Briefs system API (`@briefs/system`). Use it for local dev, CI smoke tests, and agent workflows.

## Install / run

From the repo root (workspace):

```bash
npm run briefs -- health
npm run briefs:smoke
```

Or from this package:

```bash
npm run briefs -w @briefs/cli -- items list --json
```

Build the binary:

```bash
npm run build -w @briefs/cli
./client/cli/dist/index.js health
```

## Configuration

| Variable | Default |
|----------|---------|
| `API_URL` | `http://localhost:8001` |
| `USER_ID` | `demo` |

Flags override env: `--api-url`, `--user-id`, `--json`, `--quiet`.

## Commands

```bash
briefs health
briefs items list [--status <status>]
briefs items get <id>
briefs items create --name <name> [--kind <kind>] [--description <text>]
briefs items update <id> [--status <status>] [--name <name>] [--lifecycle <lifecycle>]
briefs items activities <id>
briefs actors me
briefs smoke [--keep] [--json]
```

## Related

- [SPEC.md](./SPEC.md) — design spec
- `../web/daily/` — Briefs Daily UI
- `../plugin/` — Cursor/Codex assistant manifests and Briefs MCP configuration
