import type { ReactNode } from "react";
import { Section } from "./section";
import { handbook } from "./data";

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

function Title({ x, y, children, size = 15, anchor = "start" }: { x: number; y: number; children: ReactNode; size?: number; anchor?: "start" | "middle" }) {
  return (
    <text x={x} y={y} fill={C.ink} fontFamily={SANS} fontSize={size} fontWeight={700} textAnchor={anchor}>
      {children}
    </text>
  );
}

function Sub({ x, y, children, anchor = "start", fill = C.muted, size = 11 }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle"; fill?: string; size?: number }) {
  return (
    <text x={x} y={y} fill={fill} fontFamily={MONO} fontSize={size} textAnchor={anchor}>
      {children}
    </text>
  );
}

function Service({ x, y, w, h, title, sub, color }: { x: number; y: number; w: number; h: number; title: string; sub: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={C.surface2} stroke={C.line} />
      <rect x={x + 14} y={y + h / 2 - 5} width={10} height={10} rx={2.5} fill={color} />
      <Title x={x + 34} y={y + h / 2 - 3} size={14}>
        {title}
      </Title>
      <Sub x={x + 34} y={y + h / 2 + 14} size={10.5}>
        {sub}
      </Sub>
    </g>
  );
}

function Panel({ x, y, w, h, accent, title, sub }: { x: number; y: number; w: number; h: number; accent: string; title: string; sub: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill={C.surface} stroke={C.line} />
      <path d={`M${x + 16} ${y + 0.5} H${x + w - 16}`} stroke={accent} strokeWidth={4} strokeLinecap="round" />
      <Title x={x + 20} y={y + 32} size={16}>
        {title}
      </Title>
      <Sub x={x + 20} y={y + 51}>
        {sub}
      </Sub>
    </g>
  );
}

function Host({ x, y, w, h, name, sub }: { x: number; y: number; w: number; h: number; name: string; sub: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={9} fill={C.bg} stroke={C.line} />
      <circle cx={x + 13} cy={y + 15} r={3} fill={C.teal} />
      <text x={x + 23} y={y + 19} fill={C.ink} fontFamily={MONO} fontSize={12.5} fontWeight={600}>
        {name}
      </text>
      <Sub x={x + 12} y={y + h - 10} size={10}>
        {sub}
      </Sub>
    </g>
  );
}

function Workload({ x, y, w, h, title, sub, tag }: { x: number; y: number; w: number; h: number; title: string; sub: string; tag: string }) {
  const tagW = tag.length * 6.2 + 14;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={C.bg} stroke={C.line} />
      <rect x={x} y={y + 10} width={3} height={h - 20} rx={1.5} fill={C.tealFill} />
      <Title x={x + 16} y={y + 21} size={13.5}>
        {title}
      </Title>
      <Sub x={x + 16} y={y + h - 11} size={10.5}>
        {sub}
      </Sub>
      <rect x={x + w - tagW - 10} y={y + 9} width={tagW} height={18} rx={9} fill={C.tealSoft} />
      <Sub x={x + w - tagW / 2 - 10} y={y + 22} anchor="middle" fill={C.teal} size={10}>
        {tag}
      </Sub>
    </g>
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
  ["himachal", "laptop · hive ops"],
  ["kanpur", "laptop"],
  ["dilli", "desktop"],
  ["kerala", "postmarketOS"],
  ["mumbai", "phone VM"],
  ["termux", "android"],
  ["goa", "Pi 5 · control node"],
  ["punjab", "AWS agent box"],
] as const;

const WORKLOADS = [
  ["Hive agent fleet", "school · reef · hub · personal", "public"],
  ["Matrix / ESS", "synapse · MAS · MatrixRTC", "public"],
  ["CFP dashboard", "conference review tool", "tailnet"],
  ["Postgres 16", "nightly dumps → S3", "internal"],
] as const;

const TITLE = "Architecture of James Reilly's infrastructure";
const DESC =
  "The personal fleet of eight Ansible-managed machines and the TunaOS Talos Kubernetes cluster in AWS are joined by a Tailscale mesh. Bitwarden supplies secrets to the fleet at run time; every fleet machine pulls the GitHub repo daily; Hive agents in the cluster open pull requests back to GitHub; Cloudflare provides DNS and public ingress to the cluster.";

function WideDiagram() {
  return (
    <svg viewBox="0 0 1000 540" role="img" aria-labelledby="arch-wide-title arch-wide-desc" className="h-auto w-full">
      <title id="arch-wide-title">{TITLE}</title>
      <desc id="arch-wide-desc">{DESC}</desc>
      <Defs id="arrow-wide" />

      <Service x={40} y={20} w={240} h={62} title="Bitwarden" sub="secrets vault" color={C.rust} />
      <Service x={380} y={20} w={240} h={62} title="GitHub" sub="hanthor/dotfiles · CI" color={C.ink} />
      <Service x={720} y={20} w={240} h={62} title="Cloudflare" sub="DNS · proxy · this Worker" color={C.orangeFill} />

      <Flow id="arrow-wide" d="M160 82 V156" />
      <Flow id="arrow-wide" d="M440 82 C440 126 330 114 330 156" />
      <Flow id="arrow-wide" d="M690 160 C690 116 560 126 560 86" />
      <Flow id="arrow-wide" d="M840 82 V156" />
      <Pill x={160} y={121} text="secrets at run time" />
      <Pill x={385} y={121} text="daily pull" />
      <Pill x={625} y={121} text="Hive PRs" />
      <Pill x={840} y={121} text="public ingress" />

      <Panel x={20} y={160} w={380} h={360} accent={C.orangeFill} title="Personal fleet" sub="Ansible · every host applies itself" />
      {HOSTS.map(([name, sub], i) => (
        <Host key={name} x={40 + (i % 2) * 178} y={232 + Math.floor(i / 2) * 52} w={164} h={44} name={name} sub={sub} />
      ))}
      <rect x={40} y={448} width={342} height={52} rx={10} fill="none" stroke={C.orange} strokeDasharray="5 5" />
      <text x={56} y={470} fill={C.ink} fontFamily={MONO} fontSize={12.5} fontWeight={600}>
        bihar + karnataka
      </text>
      <Sub x={56} y={488} size={10}>
        home Talos cluster · AMD GPU
      </Sub>
      <rect x={290} y={462} width={78} height={22} rx={11} fill="var(--ix-orange-soft)" />
      <Sub x={329} y={477} anchor="middle" fill={C.orange} size={10}>
        in storage
      </Sub>

      <rect x={440} y={160} width={120} height={360} rx={16} fill={C.tealSoft} stroke={C.teal} strokeOpacity={0.45} strokeDasharray="2 6" strokeLinecap="round" />
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
      <Flow id="arrow-wide" d="M404 346 H436" color={C.teal} both />
      <Flow id="arrow-wide" d="M564 346 H596" color={C.teal} both />

      <Panel x={600} y={160} w={380} h={360} accent={C.tealFill} title="TunaOS · AWS eu-north-1" sub="Talos Linux + Kubernetes · OpenTofu" />
      {WORKLOADS.map(([title, sub, tag], i) => (
        <Workload key={title} x={620} y={232 + i * 60} w={340} h={50} title={title} sub={sub} tag={tag} />
      ))}
      <Sub x={620} y={492} size={10.5}>
        backups: verified dumps → S3 · daily EBS snapshots
      </Sub>
    </svg>
  );
}

function TallDiagram() {
  return (
    <svg viewBox="0 0 360 980" role="img" aria-labelledby="arch-tall-title arch-tall-desc" className="mx-auto h-auto w-full max-w-md">
      <title id="arch-tall-title">{TITLE}</title>
      <desc id="arch-tall-desc">{DESC}</desc>
      <Defs id="arrow-tall" />

      <Service x={8} y={8} w={166} h={56} title="Bitwarden" sub="secrets vault" color={C.rust} />
      <Service x={186} y={8} w={166} h={56} title="GitHub" sub="hanthor/dotfiles" color={C.ink} />
      <Flow id="arrow-tall" d="M91 64 V108" />
      <Flow id="arrow-tall" d="M269 64 V108" />
      <Pill x={91} y={87} text="run-time secrets" />
      <Pill x={269} y={87} text="daily pull" />

      <Panel x={8} y={112} w={344} h={332} accent={C.orangeFill} title="Personal fleet" sub="Ansible · every host applies itself" />
      {HOSTS.map(([name, sub], i) => (
        <Host key={name} x={22 + (i % 2) * 162} y={178 + Math.floor(i / 2) * 50} w={154} h={42} name={name} sub={sub} />
      ))}
      <rect x={22} y={382} width={316} height={46} rx={10} fill="none" stroke={C.orange} strokeDasharray="5 5" />
      <text x={36} y={401} fill={C.ink} fontFamily={MONO} fontSize={12} fontWeight={600}>
        bihar + karnataka
      </text>
      <Sub x={36} y={418} size={10}>
        home Talos cluster
      </Sub>
      <rect x={250} y={394} width={76} height={22} rx={11} fill="var(--ix-orange-soft)" />
      <Sub x={288} y={409} anchor="middle" fill={C.orange} size={10}>
        in storage
      </Sub>

      <Flow id="arrow-tall" d="M180 444 V466" color={C.teal} />
      <rect x={8} y={470} width={344} height={54} rx={14} fill={C.tealSoft} stroke={C.teal} strokeOpacity={0.45} strokeDasharray="2 6" strokeLinecap="round" />
      <Title x={180} y={493} size={15} anchor="middle">
        Tailscale
      </Title>
      <Sub x={180} y={511} anchor="middle">
        WireGuard mesh · MagicDNS
      </Sub>
      <Flow id="arrow-tall" d="M180 524 V546" color={C.teal} />

      <Panel x={8} y={550} w={344} h={336} accent={C.tealFill} title="TunaOS · AWS eu-north-1" sub="Talos + Kubernetes · OpenTofu" />
      {WORKLOADS.map(([title, sub, tag], i) => (
        <Workload key={title} x={22} y={616 + i * 58} w={316} h={50} title={title} sub={sub} tag={tag} />
      ))}
      <Sub x={22} y={866} size={10}>
        backups: verified dumps → S3 · EBS snapshots
      </Sub>

      <Flow id="arrow-tall" d="M180 916 V890" />
      <Pill x={250} y={903} text="public ingress" />
      <Service x={97} y={916} w={166} h={56} title="Cloudflare" sub="DNS · proxy · edge" color={C.orangeFill} />
    </svg>
  );
}

const TEXT_VERSION: [string, string][] = [
  ["Personal fleet", "Eight Ansible-managed machines: laptops, a desktop, an ARM device, the phone (VM and Termux), a Raspberry Pi 5 control node and an AWS agent box. Each one applies the repo itself."],
  ["Tailscale", "A WireGuard mesh joins the fleet and the cluster, with MagicDNS names and no hand-managed VPN."],
  ["TunaOS cluster", "Two-node Talos Kubernetes cluster in AWS eu-north-1, all codified in OpenTofu. It runs the Hive agent fleet, Matrix/ESS, the CFP dashboard and Postgres."],
  ["Bitwarden → fleet", "Secrets are fetched at run time, so nothing secret lives in the public repo."],
  ["GitHub ↔ everything", "Every machine pulls master daily. Hive agents and Renovate open PRs back into the same repo."],
  ["Cloudflare → cluster", "DNS, proxying and public ingress, plus the Worker that serves this page."],
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
          A personal fleet that configures itself, and the TunaOS cluster on AWS. Tailscale joins them, and{" "}
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
        <a href={handbook("servers/aws-k8s/cluster.html")} className="underline underline-offset-4 [--ix-link:var(--ix-teal)]">
          AWS cluster handbook
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
