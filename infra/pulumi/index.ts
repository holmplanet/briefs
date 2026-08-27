import * as digitalocean from "@pulumi/digitalocean";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const name = config.get("name") ?? "briefs-daily";
const region = config.get("region") ?? "nyc3";
const size = config.get("size") ?? "s-2vcpu-4gb";
const sshKeyName = config.require("sshKeyName");
const dropletUser = config.get("dropletUser") ?? "deploy";

const sshKey = digitalocean.getSshKey({ name: sshKeyName });

const cloudInit = `#cloud-config
package_update: true
packages:
  - ca-certificates
  - curl
  - git
  - ufw
runcmd:
  - install -m 0755 -d /etc/apt/keyrings
  - curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  - chmod a+r /etc/apt/keyrings/docker.asc
  - bash -c 'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list'
  - apt-get update
  - apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  - id -u ${dropletUser} >/dev/null 2>&1 || useradd --create-home --shell /bin/bash ${dropletUser}
  - usermod -aG docker ${dropletUser}
  - ufw allow OpenSSH
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw --force enable
`;

const droplet = new digitalocean.Droplet(name, {
  name,
  region,
  size,
  image: "ubuntu-24-04-x64",
  sshKeys: [sshKey.then((key) => key.id)],
  monitoring: true,
  ipv6: true,
  tags: ["briefs-prod", "briefs-daily"],
  userData: cloudInit,
});

const firewall = new digitalocean.Firewall(`${name}-firewall`, {
  name: `${name}-firewall`,
  dropletIds: [droplet.id],
  inboundRules: [
    { protocol: "tcp", portRange: "22", sourceAddresses: ["0.0.0.0/0", "::/0"] },
    { protocol: "tcp", portRange: "80", sourceAddresses: ["0.0.0.0/0", "::/0"] },
    { protocol: "tcp", portRange: "443", sourceAddresses: ["0.0.0.0/0", "::/0"] },
  ],
  outboundRules: [
    { protocol: "tcp", portRange: "1-65535", destinationAddresses: ["0.0.0.0/0", "::/0"] },
    { protocol: "udp", portRange: "1-65535", destinationAddresses: ["0.0.0.0/0", "::/0"] },
    { protocol: "icmp", portRange: "0", destinationAddresses: ["0.0.0.0/0", "::/0"] },
  ],
});

export const dropletId = droplet.id;
export const publicIp = droplet.ipv4Address;
export const ipv6Address = droplet.ipv6Address;
