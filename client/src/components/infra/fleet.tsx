import type { ReactNode } from "react";
import { formatAgo } from "@shared/infra";
import {
  FACT_HOSTS,
  applyState,
  formatMemory,
  formatModel,
  formatOs,
  formatUptime,
  isStale,
  shortCpu,
  summarizeFleet,
  type ApplyState,
  type FleetFacts,
} from "@shared/fleet";
import { cn } from "@/lib/utils";
import { CLUSTER_NODES, FLEET, RETIRED_NOTE, handbook, hostAnchor, type Host, type HostGroup } from "./data";
import { Section } from "./section";
import { StatusDot, type DotTone } from "./status-dot";
import { useFleetFacts, useNow } from "./use-infra-api";

type FactsState = { loading: boolean; facts: FleetFacts | null | undefined };

const APPLY: Record<ApplyState, { tone: DotTone; text: string }> = {
  ok: { tone: "up", text: "last apply ok" },
  failed: { tone: "down", text: "last apply failed" },
  unknown: { tone: "unknown", text: "last apply unknown" },
};

function Specs({ rows }: { rows: [string, ReactNode][] }) {
  if (rows.length === 0) return null;
  return (
    <dl className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-t border-[color:var(--ix-line)] pt-3 text-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="pt-px text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--ix-muted)]">{k}</dt>
          <dd className="ix-mono break-words leading-snug text-[color:var(--ix-ink)]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function factRows(f: FleetFacts): [string, ReactNode][] {
  const rows: [string, ReactNode][] = [];
  const os = formatOs(f.os);
  const model = formatModel(f.hardware);
  const cpu = shortCpu(f.hardware.cpu);
  const threads = f.hardware.cpu_threads;
  const mem = formatMemory(f.hardware.memory_gb);
  const uptime = formatUptime(f.uptime_days);
  if (os) rows.push(["OS", os]);
  if (model) rows.push(["Model", model]);
  if (cpu || threads) {
    const t = threads ? `${threads} ${threads === 1 ? "thread" : "threads"}` : null;
    rows.push(["CPU", [cpu, t].filter(Boolean).join(" · ")]);
  }
  if (mem) rows.push(["Memory", mem]);
  if (f.hardware.gpus.length) rows.push(["GPU", f.hardware.gpus.join(", ")]);
  if (f.hardware.arch) rows.push(["Arch", f.hardware.arch]);
  if (uptime) rows.push(["Uptime", uptime]);
  return rows;
}

function LiveFacts({ facts, now }: { facts: FleetFacts; now: number }) {
  const stale = isStale(facts.updated, now);
  const apply = APPLY[applyState(facts.last_apply)];
  const updatedMs = facts.updated ? Date.parse(facts.updated) : NaN;
  return (
    <div className={cn("flex flex-col gap-3", stale && "opacity-70")}>
      <Specs rows={factRows(facts)} />
      <div className="ix-mono flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-[color:var(--ix-muted)]">
        {facts.virtualization ? (
          <span
            className="rounded-md bg-[color:var(--ix-orange-soft)] px-1.5 py-0.5 font-medium text-[color:var(--ix-orange)]"
            title={`Virtual machine (${facts.virtualization})`}
          >
            VM · {facts.virtualization}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <StatusDot tone={apply.tone} className="h-2 w-2 [&>span]:h-2 [&>span]:w-2" />
          {apply.text}
        </span>
        <span className={cn(stale && "text-[color:var(--ix-orange)]")}>
          {facts.updated ? (
            <time dateTime={facts.updated} title={new Date(updatedMs).toUTCString()}>
              reported {formatAgo(updatedMs, now)}
            </time>
          ) : (
            "report time unknown"
          )}
          {stale ? " · stale" : null}
        </span>
      </div>
    </div>
  );
}

function HostCard({ host, live, now }: { host: Host; live?: FactsState; now: number }) {
  const offline = host.state === "offline";
  const id = hostAnchor(host);
  return (
    <li className="min-w-0">
      <article
        id={id}
        tabIndex={-1}
        aria-labelledby={`${id}-name`}
        className={cn(
          "ix-card ix-host flex h-full scroll-mt-24 flex-col gap-2.5 p-4",
          offline && "border-dashed bg-transparent shadow-none",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <h4 id={`${id}-name`} className="ix-mono text-base font-semibold">
            {host.name}
          </h4>
          <span className="ix-mono inline-flex shrink-0 items-center gap-1.5 text-xs text-[color:var(--ix-muted)]">
            <StatusDot tone={offline ? "offline" : "up"} />
            {offline ? "in storage" : live ? "managed" : "running"}
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--ix-teal)]">{host.kind}</p>
        <p className="text-sm leading-relaxed text-[color:var(--ix-muted)]">{host.role}</p>

        {host.specs ? <Specs rows={host.specs} /> : null}
        {live ? (
          live.loading ? (
            <div className="flex flex-col gap-2 border-t border-[color:var(--ix-line)] pt-3" aria-hidden="true">
              {[70, 90, 55].map((w) => (
                <span key={w} className="h-3 rounded bg-[color:var(--ix-surface-2)] motion-safe:animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : live.facts ? (
            <LiveFacts facts={live.facts} now={now} />
          ) : (
            <p className="border-t border-[color:var(--ix-line)] pt-3 text-xs italic leading-relaxed text-[color:var(--ix-muted)]">
              No report yet. It appears after this machine's next apply.
            </p>
          )
        ) : null}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {host.tags.map((t) => (
              <li key={t} className="ix-mono rounded-md bg-[color:var(--ix-surface-2)] px-2 py-0.5 text-[11px] text-[color:var(--ix-muted)]">
                {t}
              </li>
            ))}
          </ul>
          {host.href ? (
            <a
              href={host.href}
              className="group ix-mono inline-flex items-center gap-1 text-xs font-medium [--ix-link:var(--ix-teal)] hover:underline hover:underline-offset-4"
            >
              Handbook<span className="sr-only">: {host.name}</span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </a>
          ) : null}
        </div>
      </article>
    </li>
  );
}

function Group({ g, facts, loading, now, cols }: { g: HostGroup; facts?: Record<string, FleetFacts | null>; loading: boolean; now: number; cols: string }) {
  const publishes = (h: Host) => (FACT_HOSTS as readonly string[]).includes(h.name);
  return (
    <div>
      <div className="mb-4">
        <h3 className="font-heading text-lg font-bold">{g.title}</h3>
        <p className="mt-1 text-sm text-[color:var(--ix-muted)]">{g.blurb}</p>
      </div>
      <ul className={cn("grid gap-3", cols)}>
        {g.hosts.map((h) => (
          <HostCard key={h.name} host={h} now={now} live={publishes(h) ? { loading, facts: facts?.[h.name] } : undefined} />
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--ix-muted)]">{label}</dt>
      <dd className="mt-1">
        <span className="font-heading text-xl font-bold tabular-nums">{value}</span>
        {sub ? <span className="ix-mono ml-1.5 text-xs text-[color:var(--ix-muted)]">{sub}</span> : null}
      </dd>
    </div>
  );
}

function Summary({ facts, loading, failed }: { facts?: Record<string, FleetFacts | null>; loading: boolean; failed: boolean }) {
  const s = summarizeFleet(facts ?? {}, FACT_HOSTS);
  const dash = loading || failed ? "—" : null;
  const osText = s.os.length ? s.os.map(([name, n]) => `${name} ×${n}`).join(" · ") : "none yet";
  return (
    <div className="ix-card mb-10 p-4 sm:p-5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <Stat label="Reporting" value={dash ?? s.reporting} sub={`of ${s.total} machines`} />
        <Stat label="Memory" value={dash ?? (s.memoryGb ? `${s.memoryGb >= 10 ? Math.round(s.memoryGb) : s.memoryGb} GB` : "—")} sub="total" />
        <Stat label="CPU threads" value={dash ?? (s.threads || "—")} sub="total" />
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-[color:var(--ix-muted)]">Operating systems</dt>
          <dd className="ix-mono mt-1.5 text-sm leading-snug">{dash ?? osText}</dd>
        </div>
      </dl>
      <p className="mt-4 border-t border-[color:var(--ix-line)] pt-3 text-xs leading-relaxed text-[color:var(--ix-muted)]">
        {failed
          ? "Live device facts are unavailable right now; the static fleet below is unaffected."
          : "Live device facts: each machine publishes its OS and hardware at the end of every apply (never addresses or serials). Refreshed every 10 minutes."}{" "}
        <a href={handbook("roles/fleet_facts.html")} className="underline underline-offset-4 [--ix-link:var(--ix-teal)]">
          How it works
        </a>
      </p>
    </div>
  );
}

export function Fleet() {
  const { data, isPending, isError } = useFleetFacts();
  const now = useNow(60_000);
  const facts = data?.hosts;
  const loading = isPending;
  return (
    <Section
      id="fleet"
      index="04"
      eyebrow="The fleet"
      title="Named after Indian states"
      intro="Every host appears in one Ansible inventory, and group membership decides which roles it gets. Adding a machine takes a single command that registers it and bootstraps it over SSH."
    >
      <Summary facts={facts} loading={loading} failed={isError} />
      <div className="flex flex-col gap-10">
        {FLEET.map((g) => (
          <Group key={g.id} g={g} facts={facts} loading={loading} now={now} cols="sm:grid-cols-2 lg:grid-cols-3" />
        ))}
        <div className="grid gap-x-6 gap-y-10 lg:grid-cols-2">
          {CLUSTER_NODES.map((g) => (
            <Group key={g.id} g={g} loading={false} now={now} cols="sm:grid-cols-2" />
          ))}
        </div>
      </div>
      <p className="mt-8 text-sm text-[color:var(--ix-muted)]">
        {RETIRED_NOTE}{" "}
        <a href={handbook("inventory.html")} className="underline underline-offset-4 [--ix-link:var(--ix-teal)]">
          Inventory &amp; groups
        </a>
      </p>
    </Section>
  );
}
