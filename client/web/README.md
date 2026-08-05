# Web clients

Human-facing vertical UIs. Each package imports from `@briefs/shared`, `@briefs/web-shared`, and calls `@briefs/system` APIs.

```
client/web/
  shared/     @briefs/web-shared — UI primitives, layout, theme (all verticals)
  docs/       @briefs/docs — SDK documentation
  daily/      @briefs/daily — Briefs Daily (default daily driver)
  livestock/  @briefs/livestock (placeholder)
  fishing/    @briefs/fishing (placeholder)
```

| Package | Vertical |
|---------|----------|
| `@briefs/web-shared` | Shared UI + theme for all web verticals |
| `@briefs/docs` | SDK documentation site |
| `@briefs/daily` | Default Briefs web client (daily driver) |
| `@briefs/livestock` | Livestock (placeholder — add to root `workspaces` when active) |
| `@briefs/fishing` | Fishing (placeholder — add to root `workspaces` when active) |
