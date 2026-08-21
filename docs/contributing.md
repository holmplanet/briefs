# Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the contribution workflow and
[CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) for community expectations.

## Local verification

```bash
npm ci
npm run typecheck
npm test
npm run test -w @briefs/daily
npm run build
```

Use a separate local or preview database. Never point development or preview at
production data. Do not commit `.env` files, access tokens, OTPs, or real user
data.

## Change boundaries

- Update shared schemas before changing consumers.
- Preserve user ownership checks in every API route.
- Keep activity records append-only.
- Add or update tests for authentication and API behavior.
- Smoke-test MCP changes through the authenticated tool path.
