# Production deployment

Briefs production is an image-only Docker Compose deployment on a DigitalOcean droplet. The
droplet runs Postgres, System, MCP, and Daily on a private Docker network. The application ports
bind to loopback; Caddy is the only public application ingress.

This runbook intentionally uses placeholders. Replace values locally; never commit a real
hostname, IP address, email allowlist, fingerprint, token, or secret to this public repository.

## Deployment sequence

The safe order is:

1. Log in to Pulumi Cloud and select the intended stack.
2. Configure a pinned DigitalOcean image ID, region, size, existing SSH key, backups, and a
   narrowly scoped SSH CIDR.
3. Run `pulumi preview`, review the firewall and resource plan, then explicitly approve
   `pulumi up`.
4. Record the returned Droplet addresses privately. Pulumi does not manage DNS.
5. In the DNS provider, create A and AAAA records for `<obscure-host>.holmplanet.com` pointing
   to those addresses. A short TTL such as 300 seconds is useful during initial setup.
6. Verify the SSH host fingerprint from the Droplet Console before trusting it locally.
7. Configure the ignored runtime file and authenticate the Infisical CLI as the human deploy
   operator.
8. Run `npm run deploy`, then perform the smoke checks below.

The deploy script builds the application images for `linux/amd64`, matching the default
DigitalOcean Droplet architecture. Set `TARGET_PLATFORM` explicitly only when deploying to a
different architecture.

Application images are tagged with the 12-character Git commit identifier used for the deployment and
transferred directly to the Droplet; the base images are pinned by digest in the Dockerfiles. If
a registry is introduced later, promote the same images by immutable OCI digest and verify the
digest after pull before starting Compose.

An obscure subdomain reduces casual scanning and accidental discovery. It is not security:
authentication, exact OAuth redirect validation, the email allowlist, TLS, and the firewall are
the actual controls.

## Prerequisites

- A DigitalOcean droplet with Docker and Compose installed.
- A deploy user with SSH access.
- Strict SSH host verification via `SSH_KNOWN_HOSTS_FILE`.
- An authenticated Infisical CLI session with access to the Briefs project.
- Production OAuth redirect URI and Resend sender/API key.
- A local production runtime file at `deploy/docker.production.env`.

Briefs uses standard PostgreSQL through `DATABASE_URL`; see [`docs/database.md`](database.md) for
Neon, Supabase, local, and self-hosted provider examples.

## Configure

Copy `deploy/docker.production.env.example` to `deploy/docker.production.env` and set the public
URLs and sender configuration. This file is ignored by Git and must contain non-secret runtime
configuration only. Copy `deploy/.deploy.local.example` to `deploy/.deploy.local` and fill in
the deploy-only values below. `deploy.sh` loads this ignored file automatically, and never
copies it to the Droplet:

```bash
DROPLET_IP=203.0.113.10
SSH_KEY_PATH=$HOME/.ssh/briefs
SSH_KNOWN_HOSTS_FILE=$HOME/.ssh/known_hosts
INFISICAL_API_URL=https://app.infisical.com
INFISICAL_PROJECT_ID=...
INFISICAL_ENV=prod
```

`INFISICAL_PROJECT_ID` identifies the project and belongs in the local shell/password manager,
not in the repository or production runtime env file. The normal path is the human CLI session.
The local deploy-context file is ignored by Git:

```bash
infisical login
npm run deploy
```

Authenticate the Infisical CLI as your human user before deploying with `infisical login`. The
CLI preserves the session in the local system keyring. The project ID is local deploy context;
do not commit it with credentials or add it to `deploy/docker.production.env`. The application
secrets remain in Infisical's `prod` environment (displayed as Production) and are installed by `deploy.sh` as
`0600` Docker secret files.

For unattended automation, `INFISICAL_TOKEN` or Universal Auth variables remain supported as an
explicit fallback. They are not required for the normal human deployment path.

Seed or validate the Infisical environment with `npm run bootstrap:secrets`, then run
`npm run deploy`. The deploy script fetches secrets, uploads the Compose bundle, writes Docker
secret files with mode `0600`, and starts the image-only stack. It does not print secret values.

## Remote operations

```bash
npm run remote:status
npm run remote:logs
npm run remote:restart
npm run remote:stop
npm run remote:start
```

## Recovery gates

Before provisioning, use a recoverable Pulumi backend; the local backend is a bootstrap aid and
is not sufficient as the only copy of infrastructure state. DigitalOcean Droplet backups are
enabled by default, but schedule a disposable restore test before treating the deployment as
production-ready. The restore test must confirm database connectivity, migrations, Daily login,
OTP delivery, and MCP bearer authentication. Record the restore date and result outside Git; do
not put database dumps or provider credentials in this repository.

## Maintenance window

Apply Ubuntu updates only during an announced maintenance window with console access available:

1. Confirm a current DigitalOcean backup or snapshot and record the current commit/image tag.
2. Confirm users are not actively signing in or using MCP.
3. From a privileged session, run `sudo apt-get update && sudo apt-get dist-upgrade`, review any
   configuration prompts, then reboot when requested.
4. After reboot, verify Docker, UFW, SSH host identity, all five Compose services, DNS, TLS, OAuth
   metadata, and the smoke checklist below.
5. If checks fail, stop ingress and restore the documented prior Droplet/image state; do not
   disable SSH verification or authentication controls to recover.

Do not run this procedure automatically from `deploy.sh`.

## Backup and restore drill

Use a disposable replacement Droplet or provider restore target; never test by overwriting the
only production instance. Record the result privately:

1. Confirm the backup timestamp and restore it to the disposable target.
2. Verify the Postgres volume, container health, migrations, Daily login/OTP delivery, and MCP
   authentication.
3. Create and read a test item, confirm its activity record, then destroy the disposable target.
4. Record backup age, restore duration, data-loss point, and any manual recovery steps.

## Monitoring acceptance criteria

At minimum, alert on failed container health checks, low disk space, sustained memory pressure,
TLS renewal/expiry failures, and a missed or stale provider backup. A scheduled HTTPS probe should
check `/api/health`, OAuth metadata, and protected-resource metadata. Alerts must go to an
out-of-band destination and must not include secrets or authorization headers. Choose the alert
provider and retention period before adding credentials or automation.

## Smoke checklist

1. `npm run remote:status` shows Postgres, System, MCP, Daily, and Caddy healthy.
2. Caddy/TLS routes the private hostname to Daily.
3. Daily login sends and accepts a real OTP.
4. MCP accepts a valid bearer token and rejects missing/invalid tokens.
5. System ignores `X-Briefs-User-Id` in production.
6. Create an item through MCP and verify it plus its activity in Daily.

Also verify:

```text
https://<obscure-host>.holmplanet.com/api/health
https://<obscure-host>.holmplanet.com/.well-known/oauth-protected-resource
https://<obscure-host>.holmplanet.com/.well-known/oauth-authorization-server
```

An unauthenticated request to `/mcp` should receive an authentication challenge and protected
resource metadata, not an open MCP session. Confirm HTTPS certificate validity, both DNS record
families, persistence after container restart, and a documented backup/restore test.

## Troubleshooting gates

- A 401 from the DigitalOcean API during preview/up usually means the token is missing, expired,
  or lacks a required custom scope. A 403 naming `tag:create` means the program is trying to use
  tags; remove optional tags or grant that scope intentionally.
- A Droplet Console that hangs does not prove the firewall is blocking SSH. Check Droplet status,
  agent health, cloud-init progress, and whether TCP/22 is reachable from the configured CIDR.
- If SSH reports an unknown or changed host key, stop and verify it out of band; do not disable
  strict host checking.
- If DNS resolves but TLS is not ready, wait for A/AAAA propagation and Caddy issuance before
  changing application auth or firewall settings.
