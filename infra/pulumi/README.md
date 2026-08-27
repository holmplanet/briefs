# Briefs DigitalOcean infrastructure

This Pulumi project provisions an isolated Ubuntu droplet for a private Briefs Daily
deployment. It owns only DigitalOcean infrastructure; Docker Compose and Infisical remain
responsible for the application stack and runtime secrets.

The stack does not create DNS records, modify the existing Hive droplet, or open application
ports directly. The droplet is prepared for a later Nginx/Caddy and Compose deployment.

## Secret boundary

Infisical is part of the deployment path, not the Pulumi program. Briefs Daily requires the
production `SESSION_SECRET` and `AUTH_SECRET`; System also requires the database, mail, and
Postgres credentials. The deploy operator should authenticate to the production Infisical
environment, materialize those values as `0600` Docker secret files on the droplet, and then
start `docker-compose.prod.yml`. Pulumi must never receive those values as config because
Pulumi state may retain configuration and resource inputs.

The intended flow is:

```text
Pulumi -> isolated Ubuntu/Docker host
Infisical -> deploy step -> Docker secret files
Docker Compose -> System + MCP + Daily + Postgres
```

The host does not need an Infisical token or agent for this first personal deployment. That
keeps the runtime boundary small and avoids adding a second credential lifecycle to the
droplet.

## Setup

Install Pulumi and dependencies, then authenticate the DigitalOcean provider with
`DIGITALOCEAN_TOKEN`. Pulumi state can use the Pulumi service backend or a team-approved
self-hosted backend; do not put provider tokens in this repository.

Pulumi only provisions the host. Infisical deploy credentials belong in the local deployment
shell/password manager and application secrets belong in Infisical; neither belongs in Pulumi
configuration or state.

```bash
npm install
pulumi stack init dev
pulumi config set sshKeyName hive
pulumi config set region nyc3
pulumi config set size s-1vcpu-2gb
pulumi config set backups true
pulumi preview
pulumi up
```

The SSH key name must already exist in the DigitalOcean account. Review the preview before
approving `pulumi up`; the default stack creates a new droplet and firewall.

Weekly Droplet backups are enabled by default and add 20% to the Droplet cost. Set `backups
false` only if you have another tested PostgreSQL backup destination.
