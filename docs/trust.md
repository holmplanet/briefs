# Trust and security

Holmplanet Brief is a coordination layer over your personal data. Trust is a product requirement, not a marketing bullet.

## Principles

1. **Read-first** — Connectors default to read-only. Writes require explicit approval through the action engine.
2. **Per-user isolation** — Every graph node, edge, action, and OAuth token is scoped to a single `userId`. Cross-tenant access is rejected.
3. **Authenticated MCP** — Production MCP endpoints require a Bearer API token. Unauthenticated requests receive `401`.
4. **No silent execution** — `approve_action` is the only path to run executors. v0 executors are draft-only (no external writes).
5. **No training on customer data** — Holmplanet does not use Brief graph data to train models. (Policy stub — formal DPA at enterprise launch.)

## MCP authentication

Brief uses the same **Bearer-on-every-request** middleware pattern as Fairway (`requireBearerAuth` from the MCP SDK), but **not** Fairway's Supabase stack. Auth is Holmplanet-owned **API bearer tokens** stored hashed in Postgres (or in-memory locally).

| Mode | When | Behavior |
|------|------|----------|
| **Required** | `BRIEF_ENV=production` or `BRIEF_MCP_AUTH_ENABLED=true` | `Authorization: Bearer <token>` required on `/mcp` |
| **Disabled** | `BRIEF_MCP_AUTH_DISABLED=true` | Local dev/tests only; `userId` may be passed in tool args |

### Create a token

```bash
curl -X POST http://localhost:8000/auth/tokens \
  -H "X-Brief-Admin-Secret: $BRIEF_AUTH_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo-user","label":"laptop"}'
```

Response includes the plaintext token once. Store it in your MCP client config:

```json
{
  "mcpServers": {
    "holmplanet-brief": {
      "url": "https://brief.example.com/mcp",
      "headers": {
        "Authorization": "Bearer brief_..."
      }
    }
  }
}
```

For local bootstrap without Postgres, set static tokens:

```bash
BRIEF_MCP_STATIC_TOKENS=demo-user:brief_dev_token_demo
```

### Google Calendar OAuth

When MCP auth is enabled, `/auth/google/start` requires the same Bearer token. The authenticated user's id is used for OAuth — do not pass `userId` in the query string.

## Per-user isolation

- **Event Graph** — Postgres queries filter by `user_id`; in-memory stores key by user.
- **MCP tools** — `userId` in tool arguments must match the authenticated user when auth is enabled.
- **Actions** — Proposals and approvals are scoped to the authenticated user.
- **Connector tokens** — Google OAuth tokens are stored per `userId`.

## Fairway comparison

We borrowed the middleware shape from Fairway Goose, not the identity provider.

| Fairway Goose | Brief |
|---------------|-------|
| Supabase Auth + JWKS | Holmplanet API bearer tokens (`brief_…`) |
| `requireBearerAuth` on `/mcp` | Same MCP SDK middleware |
| Postgres RLS | Application-level `user_id` filters on graph/actions |
| Usage gating via Supabase RPC | Not in v0 |

Brief will **not** use Supabase. Connector OAuth (Google Calendar, etc.) is separate from MCP access tokens.

## Post-v0

- Token rotation, revocation UI, and scoped token permissions
- Optional Holmplanet OAuth for MCP clients (if assistants need interactive login — not Supabase)
- Formal privacy policy and DPA
- Audit export for enterprise customers
