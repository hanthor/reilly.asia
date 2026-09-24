import { Bot, GitPullRequest, MessageSquare, RefreshCcw, ShieldCheck } from "lucide-react";
import { ciState, formatAgo, formatCount } from "@shared/infra";
import { cn } from "@/lib/utils";
import { MECHANISMS, PIPELINE, handbook } from "./data";
import { Section } from "./section";
import { StatusDot } from "./status-dot";
import { useInfraActivity, useNow } from "./use-infra-api";

const ICONS = [RefreshCcw, ShieldCheck, Bot, MessageSquare];

function Stat({ value, label, loading, accent }: { value: string; label: string; loading: boolean; accent?: boolean }) {
  return (
    <div className="flex flex-col justify-center gap-1 p-5">
      <dt className="order-2 text-sm leading-snug text-[color:var(--ix-muted)]">{label}</dt>
      <dd
        className={cn(
          "order-1 font-heading text-4xl font-bold tabular-nums tracking-tight",
          accent && "text-[color:var(--ix-teal)]",
        )}
      >
        {loading ? <span className="inline-block h-9 w-12 rounded-md bg-[color:var(--ix-surface-2)] align-middle motion-safe:animate-pulse" /> : value}
      </dd>
    </div>
  );
}

export function Automation() {
  const { data, isPending } = useInfraActivity();
  const now = useNow(30_000);
  const ci = ciState(data?.ci.conclusion);
  const days = data?.windowDays ?? 30;

  return (
    <Section
      id="automation"
      index="03"
      eyebrow="Self-maintaining"
      title="Bots do the routine work"
      intro="Every machine applies master with sudo, so a bad merge would reach the whole fleet within a day. The gate below lets routine changes land on their own and stops anything that executes."
    >
      <div className="flex flex-col gap-4">
        <div className="ix-card">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--ix-line)] px-5 py-3">
            <h3 className="ix-mono text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--ix-muted)]">
              hanthor/dotfiles · last {days} days
            </h3>
            <p className="hidden text-xs text-[color:var(--ix-muted)] md:block">
              <GitPullRequest className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
              Live from the GitHub API, refreshed hourly
            </p>
          </div>
          <dl className="grid grid-cols-2 lg:grid-cols-4 [&>*]:border-[color:var(--ix-line)] [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(even)]:border-l lg:[&>*:nth-child(-n+2)]:border-b-0 lg:[&>*:not(:first-child)]:border-l">
            <Stat value={formatCount(data?.mergedTotal)} label="PRs merged" loading={isPending} />
            <Stat value={formatCount(data?.mergedRenovate)} label="merged by Renovate" loading={isPending} accent />
            <Stat value={formatCount(data?.mergedHive)} label="merged by Hive agents (safe paths only)" loading={isPending} />
            <div className="flex flex-col justify-center gap-1 p-5">
              <dt className="order-2 text-sm leading-snug text-[color:var(--ix-muted)]">
                CI on master{data?.ci.at ? `, ${formatAgo(Date.parse(data.ci.at), now)}` : ""}
              </dt>
              <dd className="order-1 flex items-center gap-2.5 font-heading text-2xl font-bold capitalize sm:text-3xl">
                {isPending ? (
                  <span className="inline-block h-9 w-24 rounded-md bg-[color:var(--ix-surface-2)] motion-safe:animate-pulse" />
                ) : (
                  <>
                    <StatusDot tone={ci === "passing" ? "up" : ci === "failing" ? "down" : "unknown"} className="scale-125" />
                    {data?.ci.url ? (
                      <a href={data.ci.url} className="hover:underline">
                        {ci === "unknown" ? "—" : ci}
                      </a>
                    ) : (
                      <span>{ci === "unknown" ? "—" : ci}</span>
                    )}
                  </>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MECHANISMS.map((m, i) => {
            const Icon = ICONS[i];
            return (
              <li key={m.title} className="ix-card flex flex-col gap-3 p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--ix-teal-soft)] text-[color:var(--ix-teal)]">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <h3 className="font-heading text-lg font-bold leading-tight">{m.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-[color:var(--ix-muted)]">{m.body}</p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="sr-only">Path of an automated change</h3>
        <ol className="ix-mono flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center">
          {PIPELINE.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
                  i === PIPELINE.length - 1
                    ? "border-transparent bg-[color:var(--ix-teal-fill)] text-[color:var(--ix-on-fill)]"
                    : "border-[color:var(--ix-line)] bg-[color:var(--ix-surface)]",
                )}
              >
                <span className="text-xs opacity-60">{String(i + 1).padStart(2, "0")}</span>
                {step}
              </span>
              {i < PIPELINE.length - 1 ? (
                <span aria-hidden="true" className="hidden text-[color:var(--ix-muted)] sm:inline">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-[color:var(--ix-muted)]">
          How the gate works:{" "}
          <a href={handbook("automation.html")} className="underline underline-offset-4 [--ix-link:var(--ix-teal)]">
            Bots, agents &amp; guardrails
          </a>
          .
        </p>
      </div>
    </Section>
  );
}
