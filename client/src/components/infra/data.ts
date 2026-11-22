// Static content for /infra, written from hanthor/dotfiles (docs/src/fleet.md,
// host pages, docs/src/automation.md). Last synced 2026-11-19. Architecture only:
// no addresses, ports, instance IDs or allowlists belong in this file.

import type { FactHost } from "@shared/fleet";

export const HANDBOOK = "/infra/handbook/";
export const REPO_URL = "https://github.com/hanthor/dotfiles";

export const handbook = (page: string) => HANDBOOK + page;

export type HostState = "active" | "offline" | "retired";

export interface Host<N extends string = string> {
  name: N;
  kind: string;
  role: string;
  tags: string[];
  state: HostState;
  href?: string;
  /** Anchor slug (#host-<slug>); defaults to name. */
  slug?: string;
  /** Static hardware/OS facts for machines that do not publish their own. */
  specs?: [string, string][];
  /** Place in the architecture diagram's host grid (ascending), with its caption. */
  diagram?: { sub: string; order: number };
}

export const hostAnchor = (h: Pick<Host, "name" | "slug">) => `host-${h.slug ?? h.name}`;

export interface HostGroup<N extends string = string> {
  id: string;
  title: string;
  blurb: string;
  hosts: Host<N>[];
}

/** Names are typed against FACT_HOSTS, the roster the Worker serves facts for. */
export const FLEET: HostGroup<FactHost>[] = [
  {
    id: "workstations",
    title: "Workstations",
    blurb: "A desktop, laptops, an ARM device and a phone VM. Laptops apply at login, the rest on a daily timer.",
    hosts: [
      {
        name: "himachal",
        kind: "Laptop",
        role: "Everyday laptop workstation.",
        tags: ["x86_64", "Bluefin"],
        state: "active",
        diagram: { sub: "laptop", order: 0 },
        href: handbook("desktop/himachal/index.html"),
      },
      {
        name: "kanpur",
        kind: "Laptop",
        role: "Portable workstation, also used as a Windows test machine.",
        tags: ["x86_64", "Bluefin"],
        state: "offline",
        diagram: { sub: "laptop", order: 1 },
        href: handbook("desktop/kanpur/index.html"),
      },
      {
        name: "dilli",
        kind: "Desktop",
        role: "Secondary workstation that also runs the BuildStream build monitor.",
        tags: ["x86_64", "Bluefin"],
        state: "active",
        diagram: { sub: "desktop", order: 2 },
        href: handbook("desktop/dilli/index.html"),
      },
      {
        name: "kerala",
        kind: "ARM mobile",
        role: "postmarketOS device. musl libc, so packages come from apk, not Homebrew.",
        tags: ["aarch64", "postmarketOS"],
        state: "active",
        diagram: { sub: "postmarketOS", order: 3 },
        href: handbook("desktop/kerala/index.html"),
      },
      {
        name: "mumbai",
        kind: "Phone VM",
        role: "Debian VM on the phone (Android Virtualization Framework), kept to a CLI-only profile.",
        tags: ["aarch64", "Debian", "cli-only"],
        state: "offline",
        diagram: { sub: "phone VM", order: 4 },
      },
    ],
  },
  {
    id: "servers",
    title: "Agent box, Pi & phone",
    blurb: "Headless machines that apply the repo themselves, plus the raw Android layer of the phone.",
    hosts: [
      {
        name: "punjab",
        kind: "VM on karnataka",
        role: "Headless agent box where the coding agents work. A KubeVirt VM on karnataka since the AWS instance was shut down.",
        tags: ["x86_64", "Ubuntu 24.04", "KubeVirt"],
        state: "active",
        diagram: { sub: "agent VM", order: 7 },
        href: handbook("servers/punjab/index.html"),
      },
      {
        name: "goa",
        kind: "Raspberry Pi 5",
        role: "Former control node for fleet-wide health checks and the LAN inventory. Currently powered off.",
        tags: ["aarch64", "Debian 13"],
        state: "offline",
        diagram: { sub: "Pi 5 · powered off", order: 6 },
        href: handbook("servers/goa/index.html"),
      },
      {
        name: "termux",
        kind: "Android",
        role: "The phone's Termux layer. No root and no systemd, so it has its own package unit.",
        tags: ["aarch64", "Termux"],
        state: "active",
        diagram: { sub: "android", order: 5 },
      },
    ],
  },
];

// Server hosts that do not publish device facts; these specs come from the
// handbook pages. No addresses or instance IDs.
export const CLUSTER_NODES: HostGroup[] = [
  {
    id: "home-servers",
    title: "Home servers",
    blurb: "Two Bluefin boxes, each with its own single-node k3s. bihar runs the Hives; karnataka holds VMs and is their cold standby.",
    hosts: [
      {
        name: "bihar",
        kind: "Hive host · KubeStellar hub",
        role: "Runs the Hive containers that spindle fronts, and the KubeStellar hub that places workloads on karnataka.",
        tags: ["Bluefin", "k3s", "x86_64"],
        state: "active",
        href: handbook("servers/bihar.html"),
        specs: [
          ["Model", "ASRock B660M-STX · Intel"],
          ["CPU", "24 threads"],
          ["Memory", "62 GB"],
          ["OS", "Bluefin utah (bootc)"],
          ["Runs", "Hives · k3s · KubeStellar"],
        ],
      },
      {
        name: "karnataka",
        kind: "VMs · runners · Hive standby",
        role: "KubeVirt VMs (punjab and test VMs), GitHub Actions runners, Frappe LMS and Lemonade on the GPU. Takes over the Hives if bihar goes down.",
        tags: ["Bluefin", "k3s", "AMD GPU"],
        state: "active",
        href: handbook("servers/karnataka.html"),
        specs: [
          ["Model", "Framework · Strix Halo"],
          ["CPU", "AMD Ryzen AI MAX+ 395 · 32 threads"],
          ["Memory", "125 GB unified"],
          ["GPU", "AMD Radeon 8060S"],
          ["OS", "Bluefin utah (bootc)"],
        ],
      },
    ],
  },
  {
    id: "vps",
    title: "Public front door",
    blurb: "The one machine on the public internet. Everything public enters here and crosses the tailnet home.",
    hosts: [
      {
        name: "spindle",
        kind: "Oracle Cloud VPS · Frankfurt",
        role: "Caddy for every public name, the Matrix homeserver and LiveKit calls. It also holds the lease that decides which home server runs the Hives.",
        tags: ["Ubuntu 24.04", "aarch64", "Always Free"],
        state: "active",
        href: handbook("servers/spindle-vps/index.html"),
        specs: [
          ["Model", "Oracle VM.Standard.A1.Flex"],
          ["CPU", "2 OCPU · Ampere Altra"],
          ["Memory", "12 GB"],
          ["OS", "Ubuntu 24.04"],
          ["Runs", "Caddy · Matrix · LiveKit"],
        ],
      },
    ],
  },
];

/** The architecture diagram's host grid, derived from FLEET so the two cannot drift. */
export const DIAGRAM_HOSTS = FLEET.flatMap((g) => g.hosts)
  .flatMap((h) => (h.diagram ? [{ name: h.name, sub: h.diagram.sub, order: h.diagram.order }] : []))
  .sort((a, b) => a.order - b.order)
  .map(({ name, sub }) => [name, sub] as const);

export const RETIRED_NOTE =
  "Retired in 2026: the TunaOS Talos cluster and the punjab instance on AWS (shut down in October), the home Talos cluster (rebuilt as Bluefin + k3s on the same hardware), and the Hetzner VPSes matrix and telengana.";

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
    title: "Hive failover",
    body: "spindle holds a lease naming the home server that runs the Hives. If bihar stays unhealthy for five minutes, karnataka starts from a copy synced every 15 minutes.",
    href: handbook("servers/hives.html"),
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
    name: "just + native units",
    what: "One repo for every machine. Each host pulls master and runs its Bash units through just and mise; chezmoi handles the dotfiles. No central push.",
    href: handbook("architecture.html"),
  },
  {
    name: "Tailscale",
    what: "A WireGuard mesh with MagicDNS names across laptops, the phone, the home servers and the VPS. Public traffic reaches home over it.",
    href: handbook("network.html"),
  },
  {
    name: "Bitwarden",
    what: "Secrets are fetched at run time. The repo is public, and nothing secret is committed to it.",
    href: handbook("bitwarden.html"),
  },
  {
    name: "Bluefin + bootc",
    what: "The home servers run Bluefin as a bootable container image: read-only /usr, atomic updates and rollback.",
    href: handbook("servers/bihar.html"),
  },
  {
    name: "k3s + KubeVirt",
    what: "A single-node k3s on each home server. KubeVirt runs the agent box and test VMs; KubeStellar on bihar places workloads.",
    href: handbook("servers/home-k3s.html"),
  },
  {
    name: "Cloudflare",
    what: "DNS and proxying in front of spindle, plus the Worker that serves this page, the handbook and the live checks.",
    href: "https://github.com/hanthor/reilly.asia",
  },
  {
    name: "GitHub Actions",
    what: "Required checks gate every merge. It also builds and publishes the handbook.",
    href: handbook("automation.html"),
  },
  {
    name: "Hive",
    what: "Open-source AI agent orchestration that I co-maintain upstream. Agents triage issues, fix CI and open PRs around the clock; hub.tunaos.org shows every Hive.",
    href: "https://github.com/hivecommons/hive",
  },
];
