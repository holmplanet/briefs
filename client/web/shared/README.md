# @briefs/web-shared

Shared UI primitives and layout for Briefs web apps (`@briefs/docs`, `@briefs/flight-spike`, and future clients).

## Contents

- **Theme** — `styles/theme.css` (tokens, glass utilities, sky background classes)
- **Layout** — `SiteHeader`, `AppShell`, `SkyBackground`
- **Header** — `HeaderNav`, `HeaderLink`, `ApiStatusBadge`, `GitHubLink`, `defaultHeaderActions`
- **UI** — shadcn-style `Button`, `Badge`, `Card`, `Input`, `Label`, `Textarea`
- **Utils** — `cn()`

## Usage

Add to a web app's `package.json`:

```json
"@briefs/web-shared": "*"
```

In `next.config.ts`:

```ts
transpilePackages: ["@briefs/shared", "@briefs/web-shared"],
```

Import theme in the client's `globals.css` (PostCSS resolves sibling workspace paths). Scan shared components so Tailwind picks up their utility classes:

```css
@import "tailwindcss";
@source "../../../shared/src/**/*.{js,ts,jsx,tsx}";
@import "../../../shared/src/styles/theme.css";
```

```tsx
import { AppShell, Button, SkyBackground, cn } from "@briefs/web-shared";
```
