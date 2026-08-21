# Client

Everything that consumes `@briefs/system`.

```
client/
  cli/       @briefs/cli — terminal client + smoke tests
  mcp/       @briefs/mcp — MCP tools + standalone dev server
  web/       human-facing apps (`daily`, `docs`, and shared UI)
  plugin/    assistant integration (Cursor/Codex skills, MCP config)
```

Web apps are npm workspaces (`@briefs/daily`, `@briefs/docs`, and `@briefs/web-shared`). New vertical clients can be added as separate workspaces when a product need exists. Plugin is static manifests only.
