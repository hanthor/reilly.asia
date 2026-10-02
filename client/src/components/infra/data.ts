// Static content for /infra, written from hanthor/dotfiles (inventory.yml
// names/groups, host READMEs, docs/src/automation.md). Architecture only:
// no addresses, ports, instance IDs or allowlists belong in this file.

import { FACT_HOSTS, type FactHost } from "@shared/fleet";

export const HANDBOOK = "/infra/handbook/";
export const REPO_URL = "https://github.com/hanthor/dotfiles";

export const handbook = (page: string) => HANDBOOK + page;

export type HostState = "active" | "offline" | "retired";

/** Where a host sits in the architecture diagram's host grid. */
export interface DiagramNode {
  /** Caption under the node name, e.g. "Pi 5 · control node". */
  sub: string;
  /** Position in the grid, filled two per row, top-left first. */
  order: number;
}

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
  /** Present when this host is also drawn in the architecture diagram. */
  diagram?: DiagramNode;
}

export const hostAnchor = (h: Pick<Host, "name" | "slug">) => `host-${h.slug ?? h.name}`;

export interface HostGroup<N extends string = string> {
  id: string;
  title: string;
  blurb: string;
  hosts: Host<N>[];
}

// Names are typed FactHost, so a host renamed here and not in shared/fleet.ts
// (or the reverse) fails `tsc` instead of silently dropping the machine's live
// device facts. FACT_HOSTS is the roster; this is its presentation.
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
        href: handbook("desktop/himachal/index.html"),
        diagram: { sub: "laptop", order: 0 },
      },
      {
        name: "kanpur",
        kind: "Laptop",
        role: "Portable workstation.",
        tags: ["x86_64", "Bluefin"],
        state: "active",
        href: handbook("desktop/kanpur/index.html"),
        diagram: { sub: "laptop", order: 1 },
      },
      {
        name: "dilli",
        kind: "Desktop",
        role: "Secondary workstation that also runs the BuildStream build monitor.",
        tags: ["x86_64", "Bluefin"],
        state: "active",
        href: handbook("desktop/dilli/index.html"),
        diagram: { sub: "desktop", order: 2 },
      },
      {
        name: "kerala",
        kind: "ARM mobile",
        role: "postmarketOS device. musl libc, so packages come from apk, not Homebrew.",
        tags: ["aarch64", "postmarketOS"],
        state: "active",
        href: handbook("desktop/kerala/index.html"),
        diagram: { sub: "postmarketOS", order: 3 },
      },
      {
        name: "mumbai",
        kind: "Phone VM",
        role: "Debian VM on the phone (Android Virtualization Framework), kept to a CLI-only profile.",
        tags: ["aarch64", "Debian", "cli-only"],
        state: "active",
        diagram: { sub: "phone VM", order: 4 },
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
        diagram: { sub: "Pi 5 · control node", order: 6 },
      },
      {
        name: "punjab",
        kind: "AWS EC2",
        role: "Headless agent box in the TunaOS AWS account. Runs the OpenTofu config for that account.",
        tags: ["x86_64", "Ubuntu 24.04"],
        state: "active",
        href: handbook("servers/punjab/index.html"),
        diagram: { sub: "AWS agent box", order: 7 },
      },
      {
        name: "termux",
        kind: "Android",
        role: "The phone's Termux layer. No root and no systemd, so it has its own package role.",
        tags: ["aarch64", "Termux"],
        state: "active",
        diagram: { sub: "android", order: 5 },
      },
    ],
  },
];

// Talos nodes are not Ansible-managed (no SSH), so they publish no facts;
// these specs come from the cluster handbooks. No addresses or instance IDs.
export const CLUSTER_NODES: HostGroup[] = [
  {
    id: "tunaos-nodes",
    title: "TunaOS cluster nodes",
    blurb: "Two EC2 nodes in eu-north-1, both in OpenTofu. The control plane is untainted, so it runs workloads too.",
    hosts: [
      {
        name: "control-plane",
        slug: "tunaos-control-plane",
        kind: "AWS EC2 · control plane",
        role: "etcd and the Kubernetes API, plus the Hive, whose data volume is bound to this node.",
        tags: ["Talos", "x86_64", "eu-north-1"],
        state: "active",
        href: handbook("servers/aws-k8s/cluster.html#nodes"),
        specs: [
          ["Model", "Amazon EC2 m6i.2xlarge"],
          ["CPU", "8 vCPU · Intel Xeon"],
          ["Memory", "32 GB"],
          ["OS", "Talos Linux v1.13.9"],
          ["K8s", "v1.36.2"],
        ],
      },
      {
        name: "worker",
        slug: "tunaos-worker",
        kind: "AWS EC2 · worker",
        role: "Matrix/ESS and the Traefik ingress that public DNS points at.",
        tags: ["Talos", "x86_64", "eu-north-1"],
        state: "active",
        href: handbook("servers/aws-k8s/cluster.html#nodes"),
        specs: [
          ["Model", "Amazon EC2 m6i.xlarge"],
          ["CPU", "4 vCPU · Intel Xeon"],
          ["Memory", "16 GB"],
          ["OS", "Talos Linux v1.13.9"],
          ["K8s", "v1.36.2"],
        ],
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
        href: handbook("servers/talos-k8s/bihar/index.html"),
        specs: [
          ["Model", "ASRock board · Intel CPU"],
          ["OS", "Talos Linux v1.13.2"],
          ["K8s", "v1.36.1"],
        ],
      },
      {
        name: "karnataka",
        kind: "Worker",
        role: "AMD Strix Halo APU, with the GPU exposed to Kubernetes for local AI inference.",
        tags: ["Talos", "AMD GPU"],
        state: "offline",
        href: handbook("servers/talos-k8s/karnataka/index.html"),
        specs: [
          ["Model", "Framework · Strix Halo"],
          ["CPU", "AMD Ryzen AI MAX+ 395 · 32 threads"],
          ["Memory", "62 GB unified"],
          ["GPU", "AMD Radeon 8060S"],
          ["OS", "Talos Linux v1.13.2"],
          ["K8s", "v1.36.1"],
        ],
      },
    ],
  },
];

export const RETIRED_NOTE =
  "matrix and telengana, two Hetzner VPSes, were retired in 2026 once the AWS cluster took over their workloads.";

/** A host as the architecture diagram draws it: name, caption, grid position. */
export interface DiagramHost {
  name: FactHost;
  sub: string;
}

/**
 * The diagram's host grid, derived from FLEET rather than restated. Every
 * FACT_HOSTS machine must carry a `diagram` block, so adding a machine to the
 * roster without placing it in the diagram fails the roster test instead of
 * leaving the drawing quietly one node short.
 */
export const DIAGRAM_HOSTS: DiagramHost[] = FLEET.flatMap((g) => g.hosts)
  .filter((h): h is Host<FactHost> & { diagram: DiagramNode } => h.diagram !== undefined)
  .sort((a, b) => a.diagram.order - b.diagram.order)
  .map((h) => ({ name: h.name, sub: h.diagram.sub }));

/** FACT_HOSTS machines with no card in FLEET: their live facts would never render. */
export function hostsMissingCards(): string[] {
  const carded = new Set(FLEET.flatMap((g) => g.hosts).map((h) => h.name));
  return FACT_HOSTS.filter((h) => !carded.has(h));
}

/** FLEET machines that publish facts but are absent from the diagram grid. */
export function hostsMissingDiagramNodes(): string[] {
  const drawn = new Set(DIAGRAM_HOSTS.map((h) => h.name));
  return FACT_HOSTS.filter((h) => !drawn.has(h));
}

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
    what: "Open-source AI agent orchestration that I co-maintain upstream. Agents triage issues, fix CI and open PRs around the clock; hub.tunaos.org shows every Hive.",
    href: "https://github.com/hivecommons/hive",
  },
];
