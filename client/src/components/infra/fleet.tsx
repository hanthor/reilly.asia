import { cn } from "@/lib/utils";
import { FLEET, RETIRED_NOTE, handbook, type Host } from "./data";
import { Section } from "./section";
import { StatusDot } from "./status-dot";

// On lg the groups share a 5-column grid: 5 workstations, then 3 servers beside the 2-node cluster.
const SPAN: Record<number, string> = { 5: "lg:col-span-5", 3: "lg:col-span-3", 2: "lg:col-span-2" };
const COLS: Record<number, string> = { 5: "lg:grid-cols-5", 3: "lg:grid-cols-3", 2: "lg:grid-cols-2" };

function HostCard({ host }: { host: Host }) {
  const offline = host.state === "offline";
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="ix-mono text-base font-semibold">{host.name}</span>
        <span className="ix-mono inline-flex items-center gap-1.5 text-xs text-[color:var(--ix-muted)]">
          <StatusDot tone={offline ? "offline" : "up"} />
          {offline ? "in storage" : "managed"}
        </span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--ix-teal)]">{host.kind}</p>
      <p className="text-sm leading-relaxed text-[color:var(--ix-muted)]">{host.role}</p>
      <ul className="mt-auto flex flex-wrap gap-1.5 pt-1" aria-label="Details">
        {host.tags.map((t) => (
          <li key={t} className="ix-mono rounded-md bg-[color:var(--ix-surface-2)] px-2 py-0.5 text-[11px] text-[color:var(--ix-muted)]">
            {t}
          </li>
        ))}
      </ul>
    </>
  );
  const cls = cn(
    "ix-card flex h-full flex-col gap-2 p-4",
    offline && "border-dashed bg-transparent shadow-none",
    host.href && "transition-colors hover:border-[color:var(--ix-teal)]",
  );
  return (
    <li>
      {host.href ? (
        <a href={host.href} className={cls} aria-label={`${host.name}, ${host.kind}: handbook page`}>
          {body}
        </a>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </li>
  );
}

export function Fleet() {
  return (
    <Section
      id="fleet"
      index="04"
      eyebrow="The fleet"
      title="Named after Indian states"
      intro="Every host appears in one Ansible inventory, and group membership decides which roles it gets. Adding a machine takes a single command that registers it and bootstraps it over SSH."
    >
      <div className="grid gap-x-3 gap-y-10 lg:grid-cols-5">
        {FLEET.map((g) => (
          <div key={g.id} className={SPAN[g.hosts.length] ?? "lg:col-span-5"}>
            <div className="mb-4">
              <h3 className="font-heading text-lg font-bold">{g.title}</h3>
              <p className="mt-1 text-sm text-[color:var(--ix-muted)]">{g.blurb}</p>
            </div>
            <ul className={cn("grid gap-3 sm:grid-cols-2", COLS[g.hosts.length] ?? "lg:grid-cols-5")}>
              {g.hosts.map((h) => (
                <HostCard key={h.name} host={h} />
              ))}
            </ul>
          </div>
        ))}
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
