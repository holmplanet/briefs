# Architecture

Briefs is a small monorepo organized around a shared domain model, a core API,
and focused clients.

```text
Assistant (MCP) ──OAuth bearer──► MCP adapter ──► System API ──► Postgres
                                      ▲               ▲
Daily web app ──OAuth session─────────┘               │
                                                      │
                                             items, actors,
                                             activities, briefs
```

## Packages

- `shared/` contains the schemas and domain types shared by every client.
- `system/` owns the REST API, authentication issuer, services, and Postgres stores.
- `client/mcp/` exposes assistant tools for reading and writing Briefs data.
- `client/web/daily/` is the reference web interface and human brief-intake flow.
- `client/web/docs/` contains the SDK and API documentation site.
- `client/cli/` provides a terminal client and smoke-test commands.
- `client/plugin/` contains assistant manifests and the Brief workflow skill.

## Request flow

1. An assistant authenticates with OAuth and receives a bearer access token.
2. MCP tools use that token to call the System API.
3. The System API resolves the authenticated subject to an actor and user-owned data.
4. Item writes update the projection and append an activity record together.
5. Daily uses a signed browser session and reads the same user-owned records.

The local stack supports development bypasses. Production requires OAuth, signed
sessions, explicit email policy, and separate secrets and databases.
