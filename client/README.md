# Client

Everything that consumes `@briefs/system`.

```
client/
  cli/       @briefs/cli — terminal client + smoke tests (spec; see cli/SPEC.md)
  web/       human-facing vertical apps
  plugin/    assistant integration (Cursor/Codex skills, MCP config)
```

Web verticals are npm workspaces (`@briefs/daily`, `@briefs/docs`, etc.). `cli/` will be a workspace when implemented. Plugin is static manifests only.
