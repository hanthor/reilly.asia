import type { ReactNode } from "react";
import { Section } from "./section";
import { REPO_URL, handbook } from "./data";

// Hand-built diagram: one wide layout (lg+) and one tall layout (below lg), so
// text is never scaled below a readable size. Colours come from the --ix-*
// tokens, so both themes work without a second drawing.

const C = {
  ink: "var(--ix-ink)",
  muted: "var(--ix-muted)",
  line: "var(--ix-line)",
  surface: "var(--ix-surface)",
  surface2: "var(--ix-surface-2)",
  bg: "var(--ix-bg)",
  teal: "var(--ix-teal)",
  tealFill: "var(--ix-teal-fill)",
  tealSoft: "var(--ix-teal-soft)",
  orange: "var(--ix-orange)",
  orangeFill: "var(--ix-orange-fill)",
  rust: "var(--ix-rust)",
};

const MONO = "'Fira Code', ui-monospace, monospace";
const SANS = "Inter, system-ui, sans-serif";

function Title({ x, y, children, size = 15, anchor = "start", external = false }: { x: number; y: number; children: ReactNode; size?: number; anchor?: "start" | "middle"; external?: boolean }) {
  return (
    <text x={x} y={y} fill={C.ink} fontFamily={SANS} fontSize={size} fontWeight={700} textAnchor={anchor}>
      <tspan className="ix-node-label">{children}</tspan>
      {external ? <ExternalMark /> : null}
    </text>
  );
}

/** "↗" after a label: this node leaves the site. */
function ExternalMark() {
  return (
    <tspan dx={5} fill={C.muted} fontWeight={400} fontSize="0.85em" aria-hidden="true">
      ↗
    </tspan>
  );
}

// --- links ----------------------------------------------------------------
// Every meaningful node is a real <a>: in tab order (document order below),
// named for screen readers, with a hover state and a drawn focus ring.

type Box = { x: number; y: number; w: number; h: number; r: number };

const HANDBOOK_LINKS = {
  bitwarden: handbook("bitwarden.html"),
  tailscale: handbook("network.html"),
  cloudflare: handbook("servers/spindle-vps/index.html"),
  servers: handbook("fleet.html"),
  hives: handbook("servers/hives.html"),
  matrix: handbook("servers/spindle-vps/index.html"),
  kubevirt: handbook("servers/karnataka.html"),
  kubestellar: handbook("servers/home-k3s.html"),
  retired: handbook("fleet.html#retired"),
};

const isExternal = (href: string) => /^https?:\/\//.test(href);

function NodeLink({ href, label, box, children }: { href: string; label: string; box: Box; children: ReactNode }) {
  const external = isExternal(href);
  return (
    <a href={href} className="ix-node" aria-label={external ? `${label} (external site)` : label}>
      <title>{label}</title>
      {children}
      <rect className="ix-node-ring" x={box.x - 4} y={box.y - 4} width={box.w + 8} height={box.h + 8} rx={box.r + 4} />
    </a>
  );
}

function Sub({ x, y, children, anchor = "start", fill = C.muted, size = 11 }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle"; fill?: string; size?: number }) {
  return (
    <text x={x} y={y} fill={fill} fontFamily={MONO} fontSize={size} textAnchor={anchor}>
      {children}
    </text>
  );
}

function Service({ x, y, w, h, title, sub, color, href, what }: { x: number; y: number; w: number; h: number; title: string; sub: string; color: string; href: string; what: string }) {
  return (
    <NodeLink href={href} label={`${title}: ${what}`} box={{ x, y, w, h, r: 12 }}>
      <rect className="ix-node-box" x={x} y={y} width={w} height={h} rx={12} fill={C.surface2} stroke={C.line} />
      <rect x={x + 14} y={y + h / 2 - 5} width={10} height={10} rx={2.5} fill={color} />
      <Title x={x + 34} y={y + h / 2 - 3} size={14} external={isExternal(href)}>
        {title}
      </Title>
      <Sub x={x + 34} y={y + h / 2 + 14} size={10.5}>
        {sub}
      </Sub>
    </NodeLink>
  );
}

/** A panel whose header (title + subtitle) is a link; its contents link on their own. */
function Panel({ x, y, w, h, accent, title, sub, href, what }: { x: number; y: number; w: number; h: number; accent: string; title: string; sub: string; href: string; what: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill={C.surface} stroke={C.line} />
      <path d={`M${x + 16} ${y + 0.5} H${x + w - 16}`} stroke={accent} strokeWidth={4} strokeLinecap="round" />
      <NodeLink href={href} label={`${title}: ${what}`} box={{ x: x + 8, y: y + 10, w: w - 16, h: 50, r: 10 }}>
        <rect x={x + 8} y={y + 10} width={w - 16} height={50} rx={10} fill="transparent" />
        <Title x={x + 20} y={y + 32} size={16}>
          {title}
        </Title>
        <Sub x={x + 20} y={y + 51}>
          {sub}
        </Sub>
      </NodeLink>
    </g>
  );
}

function Host({ x, y, w, h, name, sub }: { x: number; y: number; w: number; h: number; name: string; sub: string }) {
  return (
    <NodeLink href={`#host-${name}`} label={`${name}, ${sub}: device card`} box={{ x, y, w, h, r: 9 }}>
      <rect className="ix-node-box" x={x} y={y} width={w} height={h} rx={9} fill={C.bg} stroke={C.line} />
      <circle cx={x + 13} cy={y + 15} r={3} fill={C.teal} />
      <text x={x + 23} y={y + 19} fill={C.ink} fontFamily={MONO} fontSize={12.5} fontWeight={600}>
        <tspan className="ix-node-label">{name}</tspan>
      </text>
      <Sub x={x + 12} y={y + h - 10} size={10}>
        {sub}
      </Sub>
    </NodeLink>
  );
}

function Workload({ x, y, w, h, title, sub, tag, href, what }: { x: number; y: number; w: number; h: number; title: string; sub: string; tag: string; href: string; what: string }) {
  const tagW = tag.length * 6.2 + 14;
  return (
    <NodeLink href={href} label={`${title}: ${what}`} box={{ x, y, w, h, r: 10 }}>
      <rect className="ix-node-box" x={x} y={y} width={w} height={h} rx={10} fill={C.bg} stroke={C.line} />
      <rect x={x} y={y + 10} width={3} height={h - 20} rx={1.5} fill={C.tealFill} />
      <Title x={x + 16} y={y + 21} size={13.5} external={isExternal(href)}>
        {title}
      </Title>
      <Sub x={x + 16} y={y + h - 11} size={10.5}>
        {sub}
      </Sub>
      <rect x={x + w - tagW - 10} y={y + 9} width={tagW} height={18} rx={9} fill={C.tealSoft} />
      <Sub x={x + w - tagW / 2 - 10} y={y + 22} anchor="middle" fill={C.teal} size={10}>
        {tag}
      </Sub>
    </NodeLink>
  );
}

function Pill({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 6.6 + 18;
  return (
    <g>
      <rect x={x - w / 2} y={y - 11} width={w} height={22} rx={11} fill={C.bg} stroke={C.line} />
      <Sub x={x} y={y + 4} anchor="middle" fill={C.ink}>
        {text}
      </Sub>
    </g>
  );
}

function Flow({ d, id, color = C.muted, both = false }: { d: string; id: string; color?: string; both?: boolean }) {
  return (
    <g>
      <path d={d} fill="none" stroke={C.line} strokeWidth={2} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        className="ix-flow"
        markerEnd={`url(#${id})`}
        markerStart={both ? `url(#${id})` : undefined}
      />
    </g>
  );
}

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill={C.muted} />
      </marker>
    </defs>
  );
}

const HOSTS = [
  ["himachal", "laptop"],
  ["kanpur", "laptop"],
  ["dilli", "desktop"],
  ["kerala", "postmarketOS"],
  ["mumbai", "phone VM"],
  ["termux", "android"],
  ["goa", "Pi 5 · powered off"],
  ["punjab", "agent VM"],
] as const;

const WORKLOADS = [
  ["Hive agent fleet", "school · reef · hub · hanthor on bihar", "public", HANDBOOK_LINKS.hives, "Hive hosting and failover, in the handbook"],
  ["Matrix + calls", "homeserver · LiveKit on spindle", "public", HANDBOOK_LINKS.matrix, "the spindle VPS handbook"],
  ["KubeVirt VMs", "punjab agent box · test VMs", "tailnet", HANDBOOK_LINKS.kubevirt, "karnataka, in the handbook"],
  ["KubeStellar", "hub on bihar · karnataka cluster", "tailnet", HANDBOOK_LINKS.kubestellar, "home k3s and KubeStellar, in the handbook"],
] as const;

const SERVICE_LINKS = {
  bitwarden: { href: HANDBOOK_LINKS.bitwarden, what: "secrets vault, handbook page" },
  github: { href: REPO_URL, what: "the hanthor/dotfiles repository" },
  cloudflare: { href: HANDBOOK_LINKS.cloudflare, what: "DNS and the spindle front door, handbook page" },
};

/** The dashed box for the retired Talos clusters, linked to the fleet page. */
function HomeCluster({ x, y, w, h, sub, size }: { x: number; y: number; w: number; h: number; sub: string; size: number }) {
  return (
    <NodeLink href={HANDBOOK_LINKS.retired} label="retired Talos clusters, AWS and home: fleet page" box={{ x, y, w, h, r: 10 }}>
      <rect className="ix-node-box" x={x} y={y} width={w} height={h} rx={10} fill="transparent" stroke={C.orange} strokeDasharray="5 5" />
      <text x={x + 14} y={y + h / 2 - 3} fill={C.ink} fontFamily={MONO} fontSize={size} fontWeight={600}>
        <tspan className="ix-node-label">Talos clusters</tspan>
      </text>
      <Sub x={x + 14} y={y + h / 2 + 14} size={10}>
        {sub}
      </Sub>
      <rect x={x + w - 92} y={y + h / 2 - 11} width={78} height={22} rx={11} fill="var(--ix-orange-soft)" />
      <Sub x={x + w - 53} y={y + h / 2 + 4} anchor="middle" fill={C.orange} size={10}>
        retired
      </Sub>
    </NodeLink>
  );
}

/** The Tailscale mesh block, linked to the network handbook page. */
function Tailscale({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children: ReactNode }) {
  return (
    <NodeLink href={HANDBOOK_LINKS.tailscale} label="Tailscale: WireGuard mesh, network handbook page" box={{ x, y, w, h, r: 14 }}>
      <rect className="ix-node-box" x={x} y={y} width={w} height={h} rx={14} fill={C.tealSoft} stroke={C.teal} strokeOpacity={0.45} strokeDasharray="2 6" strokeLinecap="round" />
      {children}
    </NodeLink>
  );
}

const TITLE = "Architecture of James Reilly's infrastructure";
const DESC =
  "The personal fleet of eight self-applying machines and the servers (two Bluefin home servers running k3s, and the spindle VPS) are joined by a Tailscale mesh. Bitwarden supplies secrets to the fleet at run time; every fleet machine pulls the GitHub repo daily; Hive agents on bihar open pull requests back to GitHub; Cloudflare provides DNS and proxies public traffic to Caddy on spindle, which forwards it over the tailnet. The AWS and home Talos clusters are retired.";

function WideDiagram() {
  return (
    <svg viewBox="0 0 1000 540" role="group" aria-labelledby="arch-wide-title" aria-describedby="arch-wide-desc" className="h-auto w-full">
      <title id="arch-wide-title">{TITLE}</title>
      <desc id="arch-wide-desc">{DESC}</desc>
      <Defs id="arrow-wide" />

      <Service x={40} y={20} w={240} h={62} title="Bitwarden" sub="secrets vault" color={C.rust} {...SERVICE_LINKS.bitwarden} />
      <Service x={380} y={20} w={240} h={62} title="GitHub" sub="hanthor/dotfiles · CI" color={C.ink} {...SERVICE_LINKS.github} />
      <Service x={720} y={20} w={240} h={62} title="Cloudflare" sub="DNS · proxy · this Worker" color={C.orangeFill} {...SERVICE_LINKS.cloudflare} />

      <Flow id="arrow-wide" d="M160 82 V156" />
      <Flow id="arrow-wide" d="M440 82 C440 126 330 114 330 156" />
      <Flow id="arrow-wide" d="M690 160 C690 116 560 126 560 86" />
      <Flow id="arrow-wide" d="M840 82 V156" />
      <Pill x={160} y={121} text="secrets at run time" />
      <Pill x={385} y={121} text="daily pull" />
      <Pill x={625} y={121} text="Hive PRs" />
      <Pill x={840} y={121} text="ingress → spindle" />

      <Panel x={20} y={160} w={380} h={360} accent={C.orangeFill} title="Personal fleet" sub="native units · every host applies itself" href="#fleet" what="jump to the fleet section" />
      {HOSTS.map(([name, sub], i) => (
        <Host key={name} x={40 + (i % 2) * 178} y={232 + Math.floor(i / 2) * 52} w={164} h={44} name={name} sub={sub} />
      ))}
      <HomeCluster x={40} y={448} w={342} h={52} sub="AWS + home · shut down Oct 2026" size={12.5} />

      <Tailscale x={440} y={160} w={120} h={360}>
        {[0, 1, 2, 4, 5, 6].map((i) => (
          <circle key={i} cx={470 + (i % 2) * 60} cy={196 + i * 48} r={3} fill={C.teal} opacity={0.5} />
        ))}
        <Title x={500} y={332} size={16} anchor="middle">
          Tailscale
        </Title>
        <Sub x={500} y={354} anchor="middle">
          WireGuard mesh
        </Sub>
        <Sub x={500} y={370} anchor="middle">
          MagicDNS
        </Sub>
      </Tailscale>
      <Flow id="arrow-wide" d="M404 346 H436" color={C.teal} both />
      <Flow id="arrow-wide" d="M564 346 H596" color={C.teal} both />

      <Panel x={600} y={160} w={380} h={360} accent={C.tealFill} title="Servers · home + spindle" sub="Bluefin · k3s · KubeVirt · Caddy" href={HANDBOOK_LINKS.servers} what="fleet status in the handbook" />
      {WORKLOADS.map(([title, sub, tag, href, what], i) => (
        <Workload key={title} x={620} y={232 + i * 60} w={340} h={50} title={title} sub={sub} tag={tag} href={href} what={what} />
      ))}
      <Sub x={620} y={492} size={10.5}>
        Hives fail over to karnataka · data synced every 15 min
      </Sub>
    </svg>
  );
}

function TallDiagram() {
  return (
    <svg viewBox="0 0 360 980" role="group" aria-labelledby="arch-tall-title" aria-describedby="arch-tall-desc" className="mx-auto h-auto w-full max-w-md">
      <title id="arch-tall-title">{TITLE}</title>
      <desc id="arch-tall-desc">{DESC}</desc>
      <Defs id="arrow-tall" />

      <Service x={8} y={8} w={166} h={56} title="Bitwarden" sub="secrets vault" color={C.rust} {...SERVICE_LINKS.bitwarden} />
      <Service x={186} y={8} w={166} h={56} title="GitHub" sub="hanthor/dotfiles" color={C.ink} {...SERVICE_LINKS.github} />
      <Flow id="arrow-tall" d="M91 64 V108" />
      <Flow id="arrow-tall" d="M269 64 V108" />
      <Pill x={91} y={87} text="run-time secrets" />
      <Pill x={269} y={87} text="daily pull" />

      <Panel x={8} y={112} w={344} h={332} accent={C.orangeFill} title="Personal fleet" sub="native units · every host applies itself" href="#fleet" what="jump to the fleet section" />
      {HOSTS.map(([name, sub], i) => (
        <Host key={name} x={22 + (i % 2) * 162} y={178 + Math.floor(i / 2) * 50} w={154} h={42} name={name} sub={sub} />
      ))}
      <HomeCluster x={22} y={382} w={316} h={46} sub="AWS + home · retired 2026" size={12} />

      <Flow id="arrow-tall" d="M180 444 V466" color={C.teal} />
      <Tailscale x={8} y={470} w={344} h={54}>
        <Title x={180} y={493} size={15} anchor="middle">
          Tailscale
        </Title>
        <Sub x={180} y={511} anchor="middle">
          WireGuard mesh · MagicDNS
        </Sub>
      </Tailscale>
      <Flow id="arrow-tall" d="M180 524 V546" color={C.teal} />

      <Panel x={8} y={550} w={344} h={336} accent={C.tealFill} title="Servers · home + spindle" sub="Bluefin · k3s · KubeVirt · Caddy" href={HANDBOOK_LINKS.servers} what="fleet status in the handbook" />
      {WORKLOADS.map(([title, sub, tag, href, what], i) => (
        <Workload key={title} x={22} y={616 + i * 58} w={316} h={50} title={title} sub={sub} tag={tag} href={href} what={what} />
      ))}
      <Sub x={22} y={866} size={10}>
        Hives fail over to karnataka · synced every 15 min
      </Sub>

      <Flow id="arrow-tall" d="M180 916 V890" />
      <Pill x={250} y={903} text="ingress → spindle" />
      <Service x={97} y={916} w={166} h={56} title="Cloudflare" sub="DNS · proxy · edge" color={C.orangeFill} {...SERVICE_LINKS.cloudflare} />
    </svg>
  );
}

const TEXT_VERSION: [string, string][] = [
  ["Personal fleet", "Eight machines: laptops, a desktop, an ARM device, the phone (VM and Termux), a Raspberry Pi 5 and the punjab agent VM. Each one applies the repo itself."],
  ["Tailscale", "A WireGuard mesh joins the fleet and the servers, with MagicDNS names and no hand-managed VPN. Public traffic crosses it from spindle to home."],
  ["Servers", "bihar runs the four Hives and the KubeStellar hub; karnataka runs KubeVirt VMs and is the Hives' cold standby; spindle, an Oracle VPS, runs Caddy, Matrix and LiveKit and holds the failover lease."],
  ["Bitwarden → fleet", "Secrets are fetched at run time, so nothing secret lives in the public repo."],
  ["GitHub ↔ everything", "Every machine pulls master daily. Hive agents and Renovate open PRs back into the same repo."],
  ["Cloudflare → spindle", "DNS and proxying in front of spindle's Caddy, plus the Worker that serves this page."],
  ["Retired", "The TunaOS Talos cluster on AWS and the home Talos cluster were shut down in October and November 2026."],
];

export function Architecture() {
  return (
    <Section
      id="architecture"
      index="02"
      eyebrow="Architecture"
      title="Two estates, one repo"
      intro={
        <>
          A personal fleet that configures itself, and the servers that run the Hives and Matrix. Tailscale joins them, and{" "}
          <a href="https://github.com/hanthor/dotfiles" className="font-medium underline decoration-[color:var(--ix-line)] underline-offset-4 [--ix-link:var(--ix-ink)] hover:decoration-[color:var(--ix-teal)]">
            hanthor/dotfiles
          </a>{" "}
          describes both.
        </>
      }
    >
      <figure className="ix-card overflow-hidden bg-[color:var(--ix-surface)] p-3 sm:p-6">
        <div className="hidden lg:block">
          <WideDiagram />
        </div>
        <div className="lg:hidden">
          <TallDiagram />
        </div>
        <figcaption className="mt-4 border-t border-[color:var(--ix-line)] pt-4">
          <p className="mb-3 text-sm text-[color:var(--ix-muted)]">
            Every box is a link: machines jump to their device card below, services open their handbook page.{" "}
            <span className="whitespace-nowrap">
              <span aria-hidden="true">↗</span> leaves the site.
            </span>
          </p>
          <details className="group">
            <summary className="ix-mono cursor-pointer select-none text-sm text-[color:var(--ix-muted)] hover:text-[color:var(--ix-ink)]">
              Text version of this diagram
            </summary>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {TEXT_VERSION.map(([k, v]) => (
                <div key={k}>
                  <dt className="font-semibold">{k}</dt>
                  <dd className="mt-1 leading-relaxed text-[color:var(--ix-muted)]">{v}</dd>
                </div>
              ))}
            </dl>
          </details>
        </figcaption>
      </figure>
      <p className="mt-4 text-sm text-[color:var(--ix-muted)]">
        Deeper:{" "}
        <a href={handbook("architecture.html")} className="underline underline-offset-4 [--ix-link:var(--ix-teal)]">
          fleet architecture
        </a>
        ,{" "}
        <a href={handbook("servers/hives.html")} className="underline underline-offset-4 [--ix-link:var(--ix-teal)]">
          Hive hosting and failover
        </a>
        ,{" "}
        <a href={handbook("cluster/hive.html")} className="underline underline-offset-4 [--ix-link:var(--ix-teal)]">
          the Hive
        </a>
        .
      </p>
    </Section>
  );
}
