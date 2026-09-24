import { RefreshCw } from "lucide-react";
import {
  PUBLIC_ENDPOINTS,
  formatAgo,
  formatLatency,
  latencyTier,
  summarize,
  type EndpointGroup,
  type EndpointStatus,
  type OverallState,
} from "@shared/infra";
import { cn } from "@/lib/utils";
import { Section } from "./section";
import { StatusDot, toneFor } from "./status-dot";
import { useInfraStatus, useNow } from "./use-infra-api";

const GROUPS: { id: EndpointGroup; title: string; blurb: string }[] = [
  { id: "hive", title: "Hive agent fleet", blurb: "Two TunaOS Hives, the TunaOS hub, and a personal Hive." },
  { id: "matrix", title: "Matrix", blurb: "Element Server Suite: homeserver, auth service and calls." },
];

const OVERALL: Record<OverallState, { text: string; tone: "up" | "down" | "unknown" }> = {
  operational: { text: "All systems operational", tone: "up" },
  degraded: { text: "Partially degraded", tone: "down" },
  down: { text: "Services unreachable", tone: "down" },
  unknown: { text: "Status unknown", tone: "unknown" },
};

const TIER_WIDTH = { fast: "w-1/4", ok: "w-1/2", slow: "w-full", none: "w-0" } as const;

function EndpointCard({ e, loading }: { e: EndpointStatus; loading: boolean }) {
  const tone = toneFor(e.up);
  const tier = latencyTier(e.latencyMs);
  const stateText = loading ? "Checking" : e.up === true ? "Up" : e.up === false ? "Down" : "Unknown";
  return (
    <li className="ix-card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{e.name}</p>
          <p className="ix-mono mt-1 truncate text-xs text-[color:var(--ix-muted)]">{e.label}</p>
        </div>
        <span
          className={cn(
            "ix-mono inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
            tone === "up" && "bg-[color:var(--ix-teal-soft)] text-[color:var(--ix-teal)]",
            tone === "down" && "bg-[color:var(--ix-rust-soft)] text-[color:var(--ix-rust)]",
            tone === "unknown" && "bg-[color:var(--ix-surface-2)] text-[color:var(--ix-muted)]",
          )}
        >
          {loading ? (
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--ix-line)] motion-safe:animate-pulse" aria-hidden="true" />
          ) : (
            <StatusDot tone={tone} />
          )}
          {stateText}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color:var(--ix-surface-2)]" aria-hidden="true">
          {loading ? (
            <div className="h-full w-1/3 rounded-full bg-[color:var(--ix-line)] motion-safe:animate-pulse" />
          ) : (
            <div
              className={cn(
                "h-full rounded-full",
                TIER_WIDTH[tier],
                tier === "slow" ? "bg-[color:var(--ix-orange-fill)]" : "bg-[color:var(--ix-teal-fill)]",
              )}
            />
          )}
        </div>
        <span className="ix-mono w-16 text-right text-xs tabular-nums text-[color:var(--ix-muted)]">
          <span className="sr-only">Latency </span>
          {loading ? "…" : formatLatency(e.latencyMs)}
        </span>
      </div>
    </li>
  );
}

export function StatusGrid() {
  const { data, isPending, isFetching, refetch } = useInfraStatus();
  const now = useNow();
  const endpoints: EndpointStatus[] =
    data?.endpoints ?? PUBLIC_ENDPOINTS.map((p) => ({ name: p.name, label: p.label, group: p.group, up: null, latencyMs: null }));
  const summary = summarize(data?.endpoints ?? []);
  const overall = isPending ? { text: "Checking services…", tone: "unknown" as const } : OVERALL[summary.state];

  const aside = (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="ix-card flex items-center gap-2.5 px-3.5 py-2 text-sm font-semibold"
        role="status"
        aria-live="polite"
      >
        <StatusDot tone={overall.tone} pulse={overall.tone === "up"} />
        {overall.text}
        {!isPending && summary.total > 0 && summary.state !== "operational" ? (
          <span className="ix-mono text-xs font-normal text-[color:var(--ix-muted)]">
            {summary.up}/{summary.total}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => refetch()}
        disabled={isFetching}
        className="ix-mono inline-flex items-center gap-2 rounded-md px-2 py-2 text-xs text-[color:var(--ix-muted)] hover:text-[color:var(--ix-ink)] disabled:opacity-60"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "motion-safe:animate-spin")} aria-hidden="true" />
        {data ? `checked ${formatAgo(Date.parse(data.checkedAt), now)}` : isPending ? "checking…" : "unavailable, retry"}
      </button>
    </div>
  );

  return (
    <Section
      id="status"
      index="01"
      eyebrow="Live status"
      title="What's running right now"
      intro="The public endpoints, probed from Cloudflare's edge at most once a minute. The Kubernetes cluster behind them runs in AWS eu-north-1."
      aside={aside}
    >
      <div className="grid gap-8 lg:grid-cols-2">
        {GROUPS.map((g) => {
          const list = endpoints.filter((e) => e.group === g.id);
          return (
            <div key={g.id}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="font-heading text-lg font-bold">{g.title}</h3>
                <p className="hidden text-sm text-[color:var(--ix-muted)] sm:block">{g.blurb}</p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {list.map((e) => (
                  <EndpointCard key={e.label} e={e} loading={isPending} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-[color:var(--ix-muted)]">
        The CFP review dashboard is reachable only over the tailnet, so it isn't listed here.
      </p>
    </Section>
  );
}
