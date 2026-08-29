# Security Policy

## Reporting a vulnerability

Please do not open a public issue for a suspected security vulnerability.
Report it privately to the maintainers through the repository's configured
security contact. Include the affected component, reproduction steps, and any
known impact.

Until a private security contact is configured, contact the repository owner
through the email listed on the maintainer's GitHub profile.

## Deployment guidance

- Never commit `.env` files or real credentials.
- Use separate databases and secrets for local, preview, and production environments.
- Keep `AUTH_DEV_BYPASS`, `API_DEV_BYPASS`, and `MCP_DEV_SKIP_AUTH` disabled in production.
- Configure `AUTH_ALLOWED_EMAILS` explicitly before enabling production OAuth.
- Rotate any credential that has appeared in logs, screenshots, or commits.
- Treat an obscure hostname as privacy/noise only; never use it in place of authentication.
- Keep production Postgres and internal service ports private; expose only the TLS ingress.
- Verify SSH host keys out of band and keep strict host-key checking enabled for deploys.
- Use least-privilege, short-lived infrastructure tokens and unset them after each operation.
