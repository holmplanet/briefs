# Web clients

Human-facing web apps. Each app imports from `@briefs/shared`, `@briefs/web-shared`, and calls `@briefs/system` APIs.

```
client/web/
  shared/     @briefs/web-shared — UI primitives, layout, theme
  docs/       @briefs/docs — SDK documentation site
  flight-spike/ @briefs/flight-spike — Briefs React/Vite client
```

| Package | Role |
|---------|----------|
| `@briefs/web-shared` | Shared UI + theme for web apps |
| `@briefs/docs` | SDK documentation site |
| `@briefs/flight-spike` | Reference Briefs web client |
