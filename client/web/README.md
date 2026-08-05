# Web clients

Human-facing vertical UIs. Each package imports from `@briefs/shared`, `@briefs/web-shared`, and calls `@briefs/system` APIs.

```
client/web/
  shared/     @briefs/web-shared — UI primitives, layout, theme (all verticals)
  core/       @briefs/core — base Briefs users
  livestock/  @briefs/livestock (placeholder)
  fishing/    @briefs/fishing (placeholder)
```

| Package | Vertical |
|---------|----------|
| `@briefs/web-shared` | Shared UI + theme for all web verticals |
| `@briefs/core` | Base users (Next.js + shadcn) |
| `@briefs/livestock` | Livestock (placeholder — add to root `workspaces` when active) |
| `@briefs/fishing` | Fishing (placeholder — add to root `workspaces` when active) |
