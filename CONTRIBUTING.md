# Contributing to Briefs

Briefs uses **trunk-based development**. `main` is the only long-lived branch.

## Workflow

1. Start from `main`:

   ```bash
   git checkout main
   git pull origin main
   ```

2. Create a short-lived branch for your work:

   ```bash
   git checkout -b feat/18-daily-brief-dogfood
   ```

3. Commit with [Conventional Commits](https://www.conventionalcommits.org/):

   ```
   feat(system): add GET /items/:id route

   Refs #18
   ```

   Use `Refs #XXX` to link issues. Do not use `Closes #XXX`.

4. Open a pull request **into `main`**. Keep PRs small and focused.

5. After merge, delete the feature branch.

## Branch naming

```
<type>/<issue-number>-<short-description>
```

Types: `feat`, `fix`, `chore`, `docs`, `ci`, `refactor`, `perf`, `test`, `build`, `style`, `hotfix`, `spike`

Examples:

- `feat/18-daily-brief-dogfood`
- `fix/42-null-owner-actor`
- `chore/7-update-dockerfile`

## What we do not use

- No `dev` branch — feature branches merge directly to `main`.
- No long-lived environment branches — deploy from `main` (or tags when we add releases).

## Before you push

- `npm ci` (not `npm install` / `npm update` unless dependency work is intentional)
- `npm run test`
- `npm run typecheck` when types change
- No secrets in commits

## Public release

Briefs is developed as an open-source core with optional hosted clients. Use
[`docs/public-release.md`](./docs/public-release.md) for the visibility,
history, GitHub protection, and hosted-deployment release gates.
