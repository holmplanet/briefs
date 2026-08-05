# @briefs/web-shared

Shared UI primitives and layout for Briefs web verticals (`@briefs/core`, `@briefs/livestock`, `@briefs/fishing`).

## Contents

- **Theme** — `styles/theme.css` (tokens, glass utilities, sky background classes)
- **Layout** — `AppShell`, `SkyBackground`
- **UI** — shadcn-style `Button`, `Badge`, `Card`, `Input`, `Label`, `Textarea`
- **Utils** — `cn()`

## Usage

Add to a vertical's `package.json`:

```json
"@briefs/web-shared": "*"
```

In `next.config.ts`:

```ts
transpilePackages: ["@briefs/shared", "@briefs/web-shared"],
```

Import theme in the vertical's `globals.css` (PostCSS resolves sibling workspace paths):

```css
@import "tailwindcss";
@import "../../../shared/src/styles/theme.css";
```

```tsx
import { AppShell, Button, SkyBackground, cn } from "@briefs/web-shared";
```
