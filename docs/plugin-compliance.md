# Plugin compliance

How Brief integrates with ChatGPT/Codex and Claude without forking the backend.

**One MCP server** in `src/mcp/`. **Two plugin surfaces** in `plugin/`.

## OpenAI / Codex / ChatGPT

References:

- [Plugin architecture](https://developers.openai.com/plugins/concepts/plugins)
- [Package your plugin](https://developers.openai.com/plugins/build/plugins)

### Required

| Artifact | Location | Purpose |
|----------|----------|---------|
| Plugin manifest | `plugin/.codex-plugin/plugin.json` | Discovery, metadata, component pointers |
| MCP config | `plugin/.mcp.json` | Remote MCP server connection |

### Shape

- **Remote HTTP MCP** pointing at the hosted Brief endpoint (not stdio for production).
- Optional **skills** under `plugin/skills/` for workflow guidance (when to call `brief_me` vs `what_changed`).
- Tools declare **`outputSchema`** when returning structured briefs.
- Use current tool visibility metadata per OpenAI plugin UI changelog.

### Legacy (optional)

- `/.well-known/ai-plugin.json` + OpenAPI spec for Custom GPT Actions and older runtimes.
- Secondary to MCP; maintain only if a target surface requires it.

## Claude

References:

- [Claude MCP docs](https://code.claude.com/docs/en/mcp)
- [Anthropic connector build guidance](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/mcp-server-dev)

### Required

| Artifact | Location | Purpose |
|----------|----------|---------|
| MCP config | `plugin/.mcp.json` | Bundled server for Claude plugins |

### Shape

- **Remote streamable HTTP MCP** for multi-tenant hosted Brief.
- OAuth at the platform layer for connector auth; bearer/session auth for MCP.
- Follow pre-submission checklist: read/write tool split, annotations, prompt-injection rules.
- Test via Claude Settings → Connectors before directory submission.

## Shared rules

1. Business logic lives in `src/` only — never in plugin manifests.
2. Plugin folders contain manifests, skills, and assets — not duplicate services.
3. MCP tools: `ingest_context`, `sync_connectors`, `brief_me`, `what_changed`, `get_context`, `propose_action`, `list_actions`, `approve_action`, `list_tasks`, `create_task`, `update_task`.
4. Vertical-specific tools are registered by `apps/*` packs post-v0.
5. Secrets via environment variables — never committed.

## Local development

```bash
cp .env.example .env
# Set BRIEF_WEATHER_LATITUDE / BRIEF_WEATHER_LONGITUDE for weather connector
# Set BRIEF_GOOGLE_CLIENT_ID / SECRET for calendar connector
npm run dev
```

Point assistants at `http://localhost:8000/mcp` or install the plugin bundle from `plugin/`.

Update `plugin/.mcp.json` URL when deploying (use your `BRIEF_PUBLIC_URL` + `/mcp`).

## Build order

1. Backend + MCP server
2. Host at stable URL
3. Wire `plugin/.mcp.json` and `plugin/.codex-plugin/plugin.json`
4. Add skills for workflow hints
5. Optional OpenAPI / ai-plugin.json for legacy clients
