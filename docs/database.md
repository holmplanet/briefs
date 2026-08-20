# Database providers

Briefs uses standard PostgreSQL. The application does not require Neon, Supabase, Vercel, or a
provider-specific database SDK.

## Support contract

- PostgreSQL 16 or newer.
- One connection string supplied as `DATABASE_URL`.
- SQL migrations in `db/migrations/` are the schema source of truth.
- Provider connection URLs must support SSL when the provider requires it.
- The same migrations and persistence behavior apply to local, hosted, and self-hosted Postgres.

The System service uses the Node `pg` driver. If a provider gives you a different variable name,
map its connection string to `DATABASE_URL` in the deployment environment rather than changing the
application code.

## Common providers

### Local Docker Postgres

The repository's development Compose file uses:

```dotenv
DATABASE_URL=postgresql://briefs:briefs@postgres:5432/briefs
```

When running the System process directly on the host, use `localhost` instead of `postgres`:

```dotenv
DATABASE_URL=postgresql://briefs:briefs@localhost:5432/briefs
```

### Neon on Vercel

Neon is the recommended hosted example for the Vercel deployment profile. Install the Neon
Marketplace integration, select a pooled/serverless connection URL, and expose that value to the
Vercel project as `DATABASE_URL`.

For previews, use a separate database branch or preview database. Do not point preview deployments
at production data.

### Supabase Postgres

Supabase is also supported as a Postgres provider. Use its pooled connection URL for serverless
Vercel functions, map it to `DATABASE_URL`, and keep Supabase Auth/Storage optional. Briefs owns its
OAuth, OTP, and authorization contracts; it does not require Supabase Auth.

### Self-hosted or other managed Postgres

Railway, Render, AWS RDS, a DigitalOcean database, or a user-managed server work the same way:
provide a reachable PostgreSQL URL as `DATABASE_URL`, ensure the network allows the application to
connect, and run the migrations before serving traffic.

## Migrations and verification

The System service runs the idempotent migrations in `db/migrations/` when it starts with a durable
`DATABASE_URL`. For a new provider:

1. Create an empty PostgreSQL 16+ database.
2. Set `DATABASE_URL` to its connection URL.
3. Start the System service once so migrations run.
4. Run `npm test` and `npm run briefs:smoke` against that environment.
5. Confirm the System `/health` endpoint and a create/list item flow.

Do not add provider-specific SQL or SDK imports to `shared/` or the System domain services without
documenting the compatibility requirement here.
