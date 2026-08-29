# Briefs DigitalOcean infrastructure

This Pulumi project provisions an isolated Ubuntu droplet for a small, private Briefs Daily
deployment. It owns only DigitalOcean infrastructure; Docker Compose and Infisical remain
responsible for the application stack and runtime secrets.

The stack does not create DNS records, modify unrelated droplets, or open application ports
directly. The droplet is prepared for a later Caddy and Compose deployment.

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
`DIGITALOCEAN_TOKEN`. Use Pulumi Cloud (or another approved recoverable backend) before
production provisioning; local-only state is not a sufficient recovery plan. Pulumi Cloud
stores infrastructure state and deployment history, but does not grant repository or host
access to other people unless you explicitly share the organization, project, or stack.
Do not put provider tokens in this repository.

Pulumi only provisions the host. Infisical deploy credentials belong in the local deployment
shell/password manager and application secrets belong in Infisical; neither belongs in Pulumi
configuration or state.

```bash
npm install
pulumi login
pulumi stack init dev
pulumi config set sshKeyName hive
pulumi config set region nyc3
pulumi config set size s-1vcpu-2gb
pulumi config set imageId <pinned-ubuntu-24-04-image-id>
pulumi config set backups true
pulumi preview
pulumi up
```

The DigitalOcean token should be short-lived and least-privilege. For this project, the custom
token needs only:

- `account:read`, `actions:read`, `regions:read`, `sizes:read`, `image:read`, `ssh_key:read`
- `droplet:create/read/update/delete`
- `firewall:create/read/update/delete`

It does not need full access, tags, domains, DNS, databases, Kubernetes, Spaces, or unrelated
resource permissions. If tags are added later, add only the required tag scopes deliberately.
Enter the token interactively, export it only for `pulumi preview` or `pulumi up`, and unset it
immediately afterward.

The SSH key name must already exist in the DigitalOcean account. Review the preview before
approving `pulumi up`; the default stack creates a new droplet and firewall.

`imageId` must be an explicit DigitalOcean Ubuntu 24.04 distribution image ID, not the moving
`ubuntu-24-04-x64` alias. Resolve the current image ID with the DigitalOcean CLI/API, record it
in Pulumi config, and change it deliberately when applying an OS update.

Weekly Droplet backups are enabled by default and add 20% to the Droplet cost. Set `backups
false` only if you have another tested PostgreSQL backup destination. A backup is not considered
verified until a fresh disposable restore has been completed and the Briefs health, login, and
MCP smoke checks pass against the restored database.

## Network and host verification

The DigitalOcean firewall permits SSH only from the configured trusted CIDR and permits public
HTTP/HTTPS for Caddy. The host's cloud-init UFW rules mirror that policy. Do not broaden SSH to
`0.0.0.0/0` merely because the DigitalOcean web console is slow or stuck; the console depends on
the Droplet agent/browser path, while direct SSH is a separate path.

Before the first direct SSH connection, verify the host key out of band from the Droplet Console:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256
```

Compare that value with the fingerprint obtained from local `ssh-keyscan` and only then add the
key to `SSH_KNOWN_HOSTS_FILE`. Deploy commands use `StrictHostKeyChecking=yes` and stop when the
host is unknown or has changed.
