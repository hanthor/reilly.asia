import { Github, BookOpen } from "lucide-react";
import { ciState, formatAgo, formatCount, summarize } from "@shared/infra";
import { cn } from "@/lib/utils";
import { HANDBOOK, REPO_URL } from "./data";
import { StatusDot } from "./status-dot";
import { useInfraActivity, useInfraStatus, useNow } from "./use-infra-api";

const FACT_CELL = [
  "",
  "border-l pl-4 md:pl-6",
  "border-t md:border-l md:border-t-0 md:pl-6",
  "border-l border-t pl-4 md:border-t-0 md:pl-6",
];

const FACTS = [
  { value: "8", label: "machines that configure themselves" },
  { value: "2", label: "Talos Kubernetes clusters" },
  { value: "0", label: "secrets in a public repo" },
  { value: "≤24h", label: "from merge to every machine" },
];

function ReadoutRow({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-[color:var(--ix-line)] py-2.5 last:border-b-0">
      <dt className="text-[color:var(--ix-muted)]">{k}</dt>
      <dd className="flex min-w-0 items-center gap-2 text-right font-medium">{children}</dd>
    </div>
  );
}

function Readout() {
  const status = useInfraStatus();
  const activity = useInfraActivity();
  const now = useNow();
  const s = status.data ? summarize(status.data.endpoints) : null;
  const ci = ciState(activity.data?.ci.conclusion);
  const loading = status.isPending;

  let statusText = "checking…";
  let tone: "up" | "down" | "unknown" = "unknown";
  if (!loading) {
    if (!s || s.state === "unknown") statusText = "unknown";
    else {
      statusText = `${s.up}/${s.total} up`;
      tone = s.state === "operational" ? "up" : "down";
    }
  }

  return (
    <div className="ix-card ix-mono overflow-hidden text-sm" aria-label="Live readout">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--ix-line)] bg-[color:var(--ix-surface-2)] px-4 py-2.5 text-xs">
        <span className="flex items-center gap-2 font-medium">
          <span aria-hidden="true" className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--ix-rust)] opacity-70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--ix-orange-fill)] opacity-80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--ix-teal-fill)] opacity-80" />
          </span>
          <span className="ml-1">live</span>
        </span>
        <span className="text-[color:var(--ix-muted)]" aria-live="polite">
          {status.data ? `checked ${formatAgo(Date.parse(status.data.checkedAt), now)}` : loading ? "…" : "offline"}
        </span>
      </div>
      <dl className="px-4 py-1.5">
        <ReadoutRow k="services">
          <StatusDot tone={tone} pulse={tone === "up"} />
          <a href="#status" className="hover:underline">
            {statusText}
          </a>
        </ReadoutRow>
        <ReadoutRow k="hive upstream">
          {status.data?.hive.latestRelease ? (
            <a
              href={status.data.hive.releaseUrl ?? "https://github.com/hivecommons/hive/releases"}
              className="truncate [--ix-link:var(--ix-teal)] hover:underline"
            >
              {status.data.hive.latestRelease}
            </a>
          ) : (
            <span className="text-[color:var(--ix-muted)]">{loading ? "…" : "—"}</span>
          )}
        </ReadoutRow>
        <ReadoutRow k="PRs merged · 30d">
          <span>{activity.isPending ? "…" : formatCount(activity.data?.mergedTotal)}</span>
        </ReadoutRow>
        <ReadoutRow k="CI on master">
          <StatusDot tone={ci === "passing" ? "up" : ci === "failing" ? "down" : "unknown"} />
          {activity.data?.ci.url ? (
            <a href={activity.data.ci.url} className="hover:underline">
              {ci}
            </a>
          ) : (
            <span>{activity.isPending ? "…" : ci}</span>
          )}
        </ReadoutRow>
      </dl>
    </div>
  );
}

export function InfraHero() {
  return (
    <section aria-labelledby="infra-title" className="ix-dots relative border-b border-[color:var(--ix-line)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-center lg:gap-16 lg:px-8 lg:pb-20 lg:pt-24">
        <div>
          <p className="ix-mono mb-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--ix-line)] bg-[color:var(--ix-surface)] px-3 py-1 text-xs font-medium text-[color:var(--ix-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--ix-teal)]" aria-hidden="true" />
            James Reilly · infrastructure
          </p>
          <h1 id="infra-title" className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Infrastructure that <span className="text-[color:var(--ix-teal)]">maintains itself</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--ix-muted)] sm:text-xl">
            Laptops, a phone, a Raspberry Pi and a Kubernetes cluster on AWS, all declared in one public repo. Every
            machine re-applies it daily. Bots ship the routine changes, and only real decisions reach a human.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={HANDBOOK}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--ix-teal-fill)] px-5 py-3 font-semibold shadow-sm [--ix-link:var(--ix-on-fill)] hover:brightness-110"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Read the handbook
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </a>
            <a
              href={REPO_URL}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[color:var(--ix-line)] bg-[color:var(--ix-surface)] px-5 py-3 font-semibold hover:border-[color:var(--ix-ink)]"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              Source on GitHub
            </a>
          </div>
        </div>
        <Readout />
      </div>
      <div className="border-t border-[color:var(--ix-line)] bg-[color:var(--ix-surface)]">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {FACTS.map((f, i) => (
            <div
              key={f.label}
              className={cn("flex flex-col gap-1 border-[color:var(--ix-line)] py-5 pr-4", FACT_CELL[i])}
            >
              <dt className="order-2 text-sm leading-snug text-[color:var(--ix-muted)]">{f.label}</dt>
              <dd className="order-1 font-heading text-3xl font-bold tracking-tight">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
