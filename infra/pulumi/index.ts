import * as digitalocean from "@pulumi/digitalocean";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const name = config.get("name") ?? "briefs-daily";
const region = config.get("region") ?? "nyc3";
const size = config.get("size") ?? "s-1vcpu-2gb";
const imageId = config.require("imageId");
const backups = config.getBoolean("backups") ?? true;
const sshKeyName = config.require("sshKeyName");
const dropletUser = config.get("dropletUser") ?? "deploy";
const sshAllowedCidrs = config.requireObject<string[]>("sshAllowedCidrs");

if (!/^[a-z_][a-z0-9_-]{0,31}$/.test(dropletUser)) {
  throw new Error("dropletUser must be a valid Linux username");
}

if (sshAllowedCidrs.length === 0 || sshAllowedCidrs.some((cidr) => !/^[0-9a-fA-F:.\/]+$/.test(cidr))) {
  throw new Error("sshAllowedCidrs must contain one or more IP/CIDR values");
}

const sshKey = digitalocean.getSshKey({ name: sshKeyName });

const cloudInit = pulumi.all([sshKey]).apply(([key]) => `#cloud-config
disable_root: true
ssh_pwauth: false
package_update: true
package_reboot_if_required: false
swap:
  filename: /swapfile
  size: 2147483648
  maxsize: 2147483648
packages:
  - ca-certificates
  - curl
  - git
  - unattended-upgrades
  - ufw
users:
  - default
  - name: ${dropletUser}
    lock_passwd: true
    shell: /bin/bash
    ssh_authorized_keys:
      - ${key.publicKey}
runcmd:
  - install -m 0755 -d /etc/apt/keyrings
  - curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  - chmod a+r /etc/apt/keyrings/docker.asc
  - bash -c 'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list'
  - apt-get update
  - apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  - usermod -aG docker ${dropletUser}
  - systemctl enable --now unattended-upgrades
${sshAllowedCidrs.map((cidr) => `  - ufw allow from ${cidr} to any port 22 proto tcp`).join("\n")}
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw --force enable
`);

const droplet = new digitalocean.Droplet(name, {
  name,
  region,
  size,
  backups,
  image: imageId,
  sshKeys: [sshKey.then((key) => String(key.id))],
  monitoring: true,
  ipv6: true,
  tags: ["briefs-prod", "briefs-daily"],
  userData: cloudInit,
});

const firewall = new digitalocean.Firewall(`${name}-firewall`, {
  name: `${name}-firewall`,
  dropletIds: [droplet.id.apply(Number)],
  inboundRules: [
    { protocol: "tcp", portRange: "22", sourceAddresses: sshAllowedCidrs },
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
