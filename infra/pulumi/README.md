# Briefs DigitalOcean infrastructure

This Pulumi project provisions an isolated Ubuntu droplet for a private Briefs Daily
deployment. It owns only DigitalOcean infrastructure; Docker Compose and Infisical remain
responsible for the application stack and runtime secrets.

The stack does not create DNS records, modify the existing Hive droplet, or open application
ports directly. The droplet is prepared for a later Nginx/Caddy and Compose deployment.

## Setup

Install Pulumi and dependencies, then authenticate the DigitalOcean provider with
`DIGITALOCEAN_TOKEN`. Pulumi state can use the Pulumi service backend or a team-approved
self-hosted backend; do not put provider tokens in this repository.

```bash
npm install
pulumi stack init dev
pulumi config set sshKeyName hive
pulumi config set region nyc3
pulumi config set size s-2vcpu-4gb
pulumi preview
pulumi up
```

The SSH key name must already exist in the DigitalOcean account. Review the preview before
approving `pulumi up`; the default stack creates a new droplet and firewall.

