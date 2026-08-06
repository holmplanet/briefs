# Client

Everything that consumes `@briefs/system`.

```
client/
  cli/       @briefs/cli — terminal client + smoke tests
  mcp/       @briefs/mcp — MCP tools + standalone dev server
  web/       human-facing vertical apps
  plugin/    assistant integration (Cursor/Codex skills, MCP config)
```

Web verticals are npm workspaces (`@briefs/daily`, `@briefs/docs`, etc.). `cli/` will be a workspace when implemented. Plugin is static manifests only.
