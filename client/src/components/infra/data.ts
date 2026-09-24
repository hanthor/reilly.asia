// Static content for /infra, written from hanthor/dotfiles (inventory.yml
// names/groups, host READMEs, docs/src/automation.md). Architecture only:
// no addresses, ports, instance IDs or allowlists belong in this file.

export const HANDBOOK = "/infra/handbook/";
export const REPO_URL = "https://github.com/hanthor/dotfiles";

export const handbook = (page: string) => HANDBOOK + page;

export type HostState = "active" | "offline" | "retired";

export interface Host {
  name: string;
  kind: string;
  role: string;
  tags: string[];
  state: HostState;
  href?: string;
}

export interface HostGroup {
  id: string;
  title: string;
  blurb: string;
  hosts: Host[];
}

export const FLEET: HostGroup[] = [
  {
    id: "workstations",
    title: "Workstations",
    blurb: "A desktop, laptops, an ARM device and a phone VM. Laptops apply at login, the rest on a daily timer.",
    hosts: [
      {
        name: "himachal",
        kind: "Laptop",
        role: "Laptop workstation. Also runs the timers that operate the Hive (rotation, watchdog, peak windows).",
        tags: ["x86_64", "Bluefin"],
        state: "active",
        href: handbook("desktop/himachal/index.html"),
      },
      {
        name: "kanpur",
        kind: "Laptop",
        role: "Portable workstation.",
        tags: ["x86_64", "Bluefin"],
        state: "active",
        href: handbook("desktop/kanpur/index.html"),
      },
      {
        name: "dilli",
        kind: "Desktop",
        role: "Secondary workstation that also runs the BuildStream build monitor.",
        tags: ["x86_64", "Bluefin"],
        state: "active",
        href: handbook("desktop/dilli/index.html"),
      },
      {
        name: "kerala",
        kind: "ARM mobile",
        role: "postmarketOS device. musl libc, so packages come from apk, not Homebrew.",
        tags: ["aarch64", "postmarketOS"],
        state: "active",
        href: handbook("desktop/kerala/index.html"),
      },
      {
        name: "mumbai",
        kind: "Phone VM",
        role: "Debian VM on the phone (Android Virtualization Framework), kept to a CLI-only profile.",
        tags: ["aarch64", "Debian", "cli-only"],
        state: "active",
      },
    ],
  },
  {
    id: "servers",
    title: "Servers & phone",
    blurb: "Headless machines, plus the raw Android layer of the phone.",
    hosts: [
      {
        name: "goa",
        kind: "Raspberry Pi 5",
        role: "Ansible control node. Runs fleet-wide applies, health checks and the LAN inventory.",
        tags: ["aarch64", "Debian 13"],
        state: "active",
        href: handbook("servers/goa/index.html"),
      },
      {
        name: "punjab",
        kind: "AWS EC2",
        role: "Headless agent box in the TunaOS AWS account. Runs the OpenTofu config for that account.",
        tags: ["x86_64", "Ubuntu 24.04"],
        state: "active",
        href: handbook("servers/punjab/index.html"),
      },
      {
        name: "termux",
        kind: "Android",
        role: "The phone's Termux layer. No root and no systemd, so it has its own package role.",
        tags: ["aarch64", "Termux"],
        state: "active",
      },
    ],
  },
  {
    id: "home-cluster",
    title: "Home Talos cluster",
    blurb: "Two-node Kubernetes cluster on the LAN. Powered down and in storage for now; it is expected back.",
    hosts: [
      {
        name: "bihar",
        kind: "Control plane",
        role: "Intel node that runs the Talos control plane.",
        tags: ["Talos", "x86_64"],
        state: "offline",
        href: handbook("servers/talos-k8s/cluster.html"),
      },
      {
        name: "karnataka",
        kind: "Worker",
        role: "AMD Strix Halo APU, with the GPU exposed to Kubernetes for local AI inference.",
        tags: ["Talos", "AMD GPU"],
        state: "offline",
        href: handbook("servers/talos-k8s/cluster.html"),
      },
    ],
  },
];

export const RETIRED_NOTE =
  "matrix and telengana, two Hetzner VPSes, were retired in 2026 once the AWS cluster took over their workloads.";

export interface Mechanism {
  title: string;
  body: string;
  href: string;
}

export const MECHANISMS: Mechanism[] = [
  {
    title: "Renovate",
    body: "Minor, patch and digest bumps merge on their own once CI is green. Cluster image bumps wait for a human to deploy them.",
    href: handbook("automation.html"),
  },
  {
    title: "Deny-by-default merges",
    body: "Hive agents can auto-merge only paths that never execute on a machine, such as docs and tests. CODEOWNERS and branch protection enforce this.",
    href: handbook("automation.html"),
  },
  {
    title: "Daily Hive upgrades",
    body: "Each day the Hives move to upstream's latest release. The canary goes first, then a soak, and a failure means rollback plus blocklist.",
    href: handbook("automation.html"),
  },
  {
    title: "Discord digest",
    body: "A daily message lists only what needs a decision: PRs labelled needs-human and cluster changes waiting to be deployed.",
    href: handbook("automation.html"),
  },
];

export const PIPELINE = ["Bot opens PR", "7 required checks", "CODEOWNERS gate", "Auto-merge", "Fleet applies within 24h"];

export interface StackItem {
  name: string;
  what: string;
  href: string;
}

export const STACK: StackItem[] = [
  {
    name: "Ansible",
    what: "One playbook for every machine. Each host pulls master and converges itself, with no central push.",
    href: handbook("architecture.html"),
  },
  {
    name: "Tailscale",
    what: "A WireGuard mesh with MagicDNS names across laptops, the phone, the Pi, AWS and in-cluster ingress.",
    href: handbook("network.html"),
  },
  {
    name: "Bitwarden",
    what: "Secrets are fetched at run time. The repo is public, and nothing secret is committed to it.",
    href: handbook("bitwarden.html"),
  },
  {
    name: "OpenTofu",
    what: "The whole AWS account is code. A plan against it should always read “No changes”.",
    href: handbook("servers/aws/index.html"),
  },
  {
    name: "Talos + Kubernetes",
    what: "An immutable, API-only OS with no SSH and no package manager, running two clusters.",
    href: handbook("servers/aws-k8s/cluster.html"),
  },
  {
    name: "Cloudflare",
    what: "DNS and proxying, plus the Worker that serves this page, the handbook and the live checks.",
    href: "https://github.com/hanthor/reilly.asia",
  },
  {
    name: "GitHub Actions",
    what: "Required checks gate every merge. It also builds and publishes the handbook.",
    href: handbook("automation.html"),
  },
  {
    name: "Hive",
    what: "Open-source AI agent orchestration. Agents triage issues, fix CI and open PRs around the clock.",
    href: handbook("cluster/hive.html"),
  },
];
