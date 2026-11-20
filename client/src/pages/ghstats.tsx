import { useEffect, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { GhSnapshot, GhLive, GhEvent, GhRange, GhScope, PrRow } from "../../../shared/ghstats";
import {
  GH_LOGIN,
  GH_ORG,
  RANGES,
  STATS_HOST,
  isBotLogin,
  parseRange,
  parseScope,
  periodAverages,
  rangeDays,
  trailingUtcDays,
} from "../../../shared/ghstats";

interface ApiResponse {
  snapshot: GhSnapshot | null;
  live: GhLive | null;
}

function KpiCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}

const AVERAGE_WINDOW_DAYS = 7;
const CHART_HEIGHT = 100;
const LOG_TICKS = [1_000, 10_000, 100_000, 1_000_000];

const formatCount = (value: number) => value.toLocaleString();
const formatAverage = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: Math.abs(value) < 100 ? 1 : 0 });
const formatCompact = (value: number) => new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);

interface TrendChartProps {
  title: string;
  values: number[];
  /** One label per value: the UTC date, or a bucket name. */
  labels: string[];
  /** Tooltip name for the primary value, e.g. "Merged". */
  valueLabel: string;
  variant?: "bar" | "line";
  /** Trailing 7-day average drawn over the bars. */
  average?: number[];
  /** Log suits heavy-tailed series such as lines changed. */
  scale?: "linear" | "log";
  axisLabels?: [string, string];
  caption?: string;
  details?: (index: number) => string[];
}

function TrendChart({
  title,
  values,
  labels,
  valueLabel,
  variant = "bar",
  average,
  scale = "linear",
  axisLabels,
  caption,
  details,
}: TrendChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const count = Math.max(values.length, 1);
  const project = scale === "log" ? (value: number) => Math.log10(1 + value) : (value: number) => value;
  const maxProjected = project(Math.max(...values, 1));
  const y = (value: number) => CHART_HEIGHT - (project(value) / maxProjected) * CHART_HEIGHT;
  const slotWidth = 1000 / count;
  const barWidth = Math.min(slotWidth, Math.max(2.2, slotWidth * 0.72));
  const centerX = (index: number) => (index + 0.5) * slotWidth;
  const toPoints = (series: number[]) => series.map((value, index) => `${centerX(index)},${y(value)}`).join(" ");
  const ticks = scale === "log" ? LOG_TICKS.filter((tick) => project(tick) < maxProjected) : [];
  const activePct = active === null ? 0 : ((active + 0.5) / count) * 100;

  const indexAt = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const index = Math.floor(((event.clientX - rect.left) / rect.width) * count);
    return Math.min(count - 1, Math.max(0, index));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = active ?? count - 1;
    const next =
      event.key === "ArrowLeft" ? Math.max(0, current - 1)
      : event.key === "ArrowRight" ? Math.min(count - 1, current + 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? count - 1
      : undefined;
    if (event.key === "Escape") setActive(null);
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {average && (
          <span className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-accent opacity-40" />
              Daily
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-3 bg-accent" />
              {AVERAGE_WINDOW_DAYS}-day avg
            </span>
          </span>
        )}
      </div>
      <div
        className="relative h-28 touch-pan-y rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        tabIndex={0}
        role="img"
        aria-label={`${title}. Use the arrow keys to inspect values.`}
        onPointerDown={(event) => setActive(indexAt(event))}
        onPointerMove={(event) => setActive(indexAt(event))}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setActive(null);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg
          className="block h-full w-full overflow-visible text-accent"
          viewBox={`0 0 1000 ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {ticks.map((tick) => (
            <line
              key={tick}
              x1="0"
              x2="1000"
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border)"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line x1="0" y1={CHART_HEIGHT} x2="1000" y2={CHART_HEIGHT} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
          {variant === "line" ? (
            <polyline
              points={toPoints(values)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            values.map((value, index) => {
              const height = value > 0 ? Math.max(CHART_HEIGHT - y(value), 1.5) : 0;
              return (
                <rect
                  key={index}
                  x={centerX(index) - barWidth / 2}
                  y={CHART_HEIGHT - height}
                  width={barWidth}
                  height={height}
                  fill="currentColor"
                  opacity={index === active ? 1 : average ? 0.4 : 0.85}
                />
              );
            })
          )}
          {average && (
            <polyline
              points={toPoints(average)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {active !== null && (
            <line
              x1={centerX(active)}
              x2={centerX(active)}
              y1="0"
              y2={CHART_HEIGHT}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {ticks.map((tick) => (
          <span
            key={tick}
            className="pointer-events-none absolute left-0 -translate-y-full text-[10px] leading-none text-muted-foreground"
            style={{ top: `${y(tick)}%` }}
            aria-hidden="true"
          >
            {formatCompact(tick)}
          </span>
        ))}
        {active !== null &&
          [variant === "line" ? values[active] : undefined, average?.[active]]
            .filter((value): value is number => value !== undefined)
            .map((value, index) => (
              <span
                key={index}
                className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-background"
                style={{ left: `${activePct}%`, top: `${y(value)}%` }}
                aria-hidden="true"
              />
            ))}
        {active !== null && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2 w-max max-w-[16rem] rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
            style={{ left: `${activePct}%`, transform: `translateX(-${activePct}%)` }}
            aria-hidden="true"
          >
            <p className="font-medium">{labels[active]}</p>
            <p>
              {valueLabel}: <span className="font-semibold tabular-nums">{formatCount(values[active])}</span>
            </p>
            {average && (
              <p>
                {AVERAGE_WINDOW_DAYS}-day avg: <span className="tabular-nums">{formatAverage(average[active])}</span>
              </p>
            )}
            {details?.(active).map((line) => (
              <p key={line} className="text-muted-foreground tabular-nums">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {active === null
          ? ""
          : [
              labels[active],
              `${valueLabel}: ${formatCount(values[active])}`,
              average ? `${AVERAGE_WINDOW_DAYS}-day average: ${formatAverage(average[active])}` : null,
              ...(details?.(active) ?? []),
            ]
              .filter(Boolean)
              .join(", ")}
      </p>
      {axisLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{axisLabels[0]}</span>
          <span>{axisLabels[1]}</span>
        </div>
      )}
      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}

function ContributionHeatmap({
  counts,
  start,
}: {
  counts: number[];
  start: string;
}) {
  if (!counts || counts.length === 0) return null;

  const weeks = Math.ceil(counts.length / 7);
  const startDate = new Date(`${start}T00:00:00Z`);
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contribution Calendar (past year)</h3>
      <div className="overflow-x-auto pb-1">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${weeks}, 12px)`,
            gridTemplateRows: "repeat(7, 12px)",
            gridAutoFlow: "column",
          }}
        >
          {counts.map((count, i) => {
            const intensity = count === 0 ? 0 : Math.max(1, Math.ceil((count / maxCount) * 4));
            const date = new Date(startDate.getTime() + i * 86_400_000).toISOString().slice(0, 10);
            const backgroundColor = intensity === 0
              ? "var(--muted)"
              : `color-mix(in srgb, var(--accent) ${intensity * 25}%, var(--card))`;
            return (
              <div
                key={i}
                className="h-3 w-3 rounded-sm border border-border"
                style={{ backgroundColor }}
                title={`${date}: ${count} contributions`}
                aria-label={`${date}: ${count} contributions`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TopRepos({
  repos,
  prs,
}: {
  repos: string[];
  prs: PrRow[];
}) {
  const repoCounts: Record<number, number> = {};
  for (const pr of prs) {
    const repoIdx = pr[0];
    repoCounts[repoIdx] = (repoCounts[repoIdx] || 0) + 1;
  }

  const sorted = Object.entries(repoCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (sorted.length === 0) return null;

  const maxCount = sorted[0][1];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Top Repositories</h3>
      <div className="space-y-2">
        {sorted.map(([repoIdx, count]) => (
          <div key={repoIdx} className="flex items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{repos[Number(repoIdx)]}</p>
            <div className="h-2 w-24 shrink-0 overflow-hidden rounded bg-muted sm:w-40">
              <div className="h-full rounded bg-accent" style={{ width: `${(count / maxCount) * 100}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right text-sm text-muted-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopAuthors({ authors, prAuthors }: { authors: string[]; prAuthors: number[] }) {
  const counts = new Map<number, number>();
  for (const a of prAuthors) counts.set(a, (counts.get(a) ?? 0) + 1);
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);
  if (sorted.length === 0) return null;
  const maxCount = sorted[0][1];
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Top Contributors</h3>
      <div className="space-y-2">
        {sorted.map(([idx, count]) => {
          const login = authors[idx] ?? "ghost";
          const bot = isBotLogin(login);
          return (
            <div key={idx} className="flex items-center gap-3">
              <a
                href={`https://github.com/${login.replace(/\[bot\]$/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
              >
                {login}
                {bot && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">bot</span>}
              </a>
              <div className="h-2 w-24 shrink-0 overflow-hidden rounded bg-muted sm:w-40">
                <div className="h-full rounded bg-accent" style={{ width: `${(count / maxCount) * 100}%` }} />
              </div>
              <span className="w-12 shrink-0 text-right text-sm text-muted-foreground">{count.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Which stats this page shows: always the org on stats.tunaos.org, else ?scope=. */
function currentScope(): { scope: GhScope; standalone: boolean } {
  if (typeof window === "undefined") return { scope: "user", standalone: false };
  if (window.location.hostname === STATS_HOST) return { scope: "org", standalone: true };
  return { scope: parseScope(new URLSearchParams(window.location.search).get("scope")), standalone: false };
}

function ScopeTabs({ scope, range }: { scope: GhScope; range: GhRange }) {
  const tab = (value: GhScope, label: string) => (
    <a
      href={statsHref(value, range)}
      aria-current={scope === value ? "page" : undefined}
      className={
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
        (scope === value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </a>
  );
  return (
    <nav aria-label="Stats scope" className="mb-4 inline-flex gap-1 rounded-lg border border-border bg-card p-1">
      {tab("user", `@${GH_LOGIN}`)}
      {tab("org", `${GH_ORG} org`)}
    </nav>
  );
}

function statsHref(scope: GhScope, range: GhRange): string {
  const params = new URLSearchParams();
  if (scope === "org") params.set("scope", "org");
  if (range !== "year") params.set("range", range);
  const query = params.toString();
  return query ? `/ghstats?${query}` : "/ghstats";
}

function currentRange(): GhRange {
  if (typeof window === "undefined") return "year";
  return parseRange(new URLSearchParams(window.location.search).get("range"));
}

function RangeTabs({ range, onChange }: { range: GhRange; onChange: (range: GhRange) => void }) {
  return (
    <div role="group" aria-label="Time range" className="inline-flex gap-1 rounded-lg border border-border bg-card p-1">
      {RANGES.map((entry) => (
        <button
          key={entry.value}
          type="button"
          aria-pressed={range === entry.value}
          onClick={() => onChange(entry.value)}
          className={
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
            (range === entry.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")
          }
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}

interface AverageRow {
  label: string;
  /** Total over the `days` full UTC days before today. */
  total: number;
}

/** Totals in the range as averages per day, week and month. */
function Averages({ rows, days, rangeLabel }: { rows: AverageRow[]; days: number; rangeLabel: string }) {
  const columns: { key: "day" | "week" | "month"; label: string }[] = [
    { key: "day", label: "Per day" },
    { key: "week", label: "Per week" },
    { key: "month", label: "Per month" },
  ];
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Averages</h3>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th scope="col" className="px-4 py-2 font-medium">{rangeLabel}</th>
              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-4 py-2 text-right font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const averages = periodAverages(row.total, days);
              return (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <th scope="row" className="px-4 py-2 text-left font-medium">{row.label}</th>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-2 text-right tabular-nums">
                      {formatAverage(averages[column.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Totals over the {days} full UTC days before today, divided by {days}. Today is still in progress, so it is left out. A week
        is 7 days and a month is 30.44 days.
      </p>
    </div>
  );
}

function TimeToMerge({ prs }: { prs: PrRow[] }) {
  const ttms = prs
    .map((pr) => (pr[3] - pr[2]) / 86_400) // mergedAt - createdAt in days
    .filter((d) => d > 0)
    .sort((a, b) => a - b);

  if (ttms.length === 0) return null;

  const median = ttms[Math.floor(ttms.length / 2)];
  const p90 = ttms[Math.floor(ttms.length * 0.9)];
  const avg = ttms.reduce((a, b) => a + b) / ttms.length;

  // Histogram: bucket into 0-1, 1-7, 7-30, 30+ days
  const buckets = [0, 0, 0, 0];
  for (const d of ttms) {
    if (d < 1) buckets[0]++;
    else if (d < 7) buckets[1]++;
    else if (d < 30) buckets[2]++;
    else buckets[3]++;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Time to Merge</h3>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <KpiCard label="Median (days)" value={median.toFixed(1)} />
        <KpiCard label="P90 (days)" value={p90.toFixed(1)} />
        <KpiCard label="Average (days)" value={avg.toFixed(1)} />
      </div>
      <TrendChart
        title="Distribution"
        values={buckets}
        labels={["Under 1 day", "1–7 days", "7–30 days", "30+ days"]}
        valueLabel="PRs"
      />
    </div>
  );
}

function Punchcard({ prs }: { prs: PrRow[] }) {
  // Build weekday (0-6) x hour (0-23) matrix
  const matrix: number[][] = Array(7)
    .fill(null)
    .map(() => Array(24).fill(0));

  for (const pr of prs) {
    const mergedDate = new Date(pr[3] * 1000);
    const dow = mergedDate.getUTCDay();
    const hour = mergedDate.getUTCHours();
    matrix[dow][hour]++;
  }

  const maxVal = Math.max(...matrix.flat());
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Merge Activity Punchcard (UTC)</h3>
      <div className="overflow-x-auto">
        <div className="inline-block">
          <div className="flex gap-1">
            <div className="w-12" />
            <div className="flex gap-1">
              {Array(24)
                .fill(0)
                .map((_, h) => (
                  <div key={h} className="w-4 text-center text-xs text-muted-foreground">
                    {h % 6 === 0 ? h : ""}
                  </div>
                ))}
            </div>
          </div>
          {matrix.map((row, dow) => (
            <div key={dow} className="flex gap-1">
              <div className="w-12 text-xs font-medium flex items-center">{dayLabels[dow]}</div>
              <div className="flex gap-1">
                {row.map((count, hour) => {
                  const intensity = count === 0 ? 0 : Math.max(1, Math.ceil((count / maxVal) * 4));
                  const backgroundColor = intensity === 0
                    ? "var(--muted)"
                    : `color-mix(in srgb, var(--accent) ${intensity * 25}%, var(--card))`;
                  return (
                    <div
                      key={hour}
                      className="h-4 w-4 rounded-sm border border-border"
                      style={{ backgroundColor }}
                      title={`${dayLabels[dow]} ${hour}:00 UTC: ${count} merges`}
                      aria-label={`${dayLabels[dow]} ${hour}:00 UTC: ${count} merges`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LinesChanged({
  prs,
  days,
  added: dailyAdded,
  deleted: dailyDeleted,
  average,
}: {
  prs: PrRow[];
  days: string[];
  added: number[];
  deleted: number[];
  average: number[];
}) {
  const dailyChanged = dailyAdded.map((value, index) => value + dailyDeleted[index]);
  const added = prs.reduce((sum, pr) => sum + pr[4], 0);
  const deleted = prs.reduce((sum, pr) => sum + pr[5], 0);
  const totalFiles = prs.reduce((sum, pr) => sum + pr[6], 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Code Changes</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiCard label="Lines Added" value={added.toLocaleString()} />
        <KpiCard label="Lines Deleted" value={deleted.toLocaleString()} />
        <KpiCard label="Files Changed" value={totalFiles.toLocaleString()} />
      </div>
      <TrendChart
        title="Lines Changed per Day (UTC, log scale)"
        values={dailyChanged}
        labels={days}
        valueLabel="Lines changed"
        average={average}
        scale="log"
        axisLabels={[days[0], "Today"]}
        caption="Additions plus deletions from PRs merged that day."
        details={(index) => [`+${formatCount(dailyAdded[index])} added`, `−${formatCount(dailyDeleted[index])} deleted`]}
      />
    </div>
  );
}

export default function GhStats() {
  const [{ scope, standalone }] = useState(currentScope);
  const [range, setRange] = useState<GhRange>(currentRange);

  const changeRange = (next: GhRange) => {
    setRange(next);
    const url = new URL(window.location.href);
    if (next === "year") url.searchParams.delete("range");
    else url.searchParams.set("range", next);
    window.history.replaceState(null, "", url);
  };
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = scope === "org" ? `${GH_ORG} on GitHub` : "GitHub Stats · James Reilly";
  }, [scope]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch(`/api/ghstats?scope=${scope}&t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch stats");
      const json = (await response.json()) as ApiResponse;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading stats...</p>
      </div>
    );
  }

  const snapshot = data?.snapshot;
  const live = data?.live;
  const generatedAt = snapshot?.generatedAt ? new Date(snapshot.generatedAt).toLocaleString() : "Unknown";

  if (!snapshot) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">{scope === "org" ? `${GH_ORG} on GitHub` : "GitHub Stats"}</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <p>Failed to load stats: {error || "No data available"}</p>
        </div>
      </div>
    );
  }

  // Series cover the whole snapshot year so the 7-day average is right from the
  // first day of a shorter range; each range shows the last `count` days.
  const count = rangeDays(range);
  const rangeEntry = RANGES.find((entry) => entry.value === range)!;
  const rangeLabel = rangeEntry.label;
  const short = `${count}d`;
  // 366 days: today plus the 365 full days the year's averages use.
  const yearDays = trailingUtcDays(366);
  const lastDays = <T,>(series: T[]) => series.slice(series.length - count);
  const days = lastDays(yearDays);
  const cutoff = Date.parse(`${days[0]}T00:00:00Z`) / 1000;
  const axisLabels: [string, string] = [days[0], "Today"];

  const yearMerged = sumByDay(yearDays, snapshot.prs, (pr) => pr[3]);
  const yearCreated = snapshot.createdPrs === undefined ? null : sumByDay(yearDays, snapshot.createdPrs, (createdAt) => createdAt);
  const yearAdded = sumByDay(yearDays, snapshot.prs, (pr) => pr[3], (pr) => pr[4]);
  const yearDeleted = sumByDay(yearDays, snapshot.prs, (pr) => pr[3], (pr) => pr[5]);
  const merged = lastDays(yearMerged);
  const created = yearCreated && lastDays(yearCreated);
  const added = lastDays(yearAdded);
  const deleted = lastDays(yearDeleted);
  const mergedAverage = lastDays(rollingAverage(yearMerged));
  const createdAverage = yearCreated && lastDays(rollingAverage(yearCreated));
  const changedAverage = lastDays(rollingAverage(yearAdded.map((value, index) => value + yearDeleted[index])));

  const inRange = snapshot.prs.map((pr) => pr[3] >= cutoff);
  const prs = snapshot.prs.filter((_, index) => inRange[index]);
  const createdPrs = snapshot.createdPrs?.filter((createdAt) => createdAt >= cutoff);
  const isOrg = scope === "org" && snapshot.scope === "org";
  const authors = snapshot.authors ?? [];
  const prAuthors = (snapshot.prAuthors ?? []).filter((_, index) => inRange[index]);
  const botMerged = prAuthors.filter((a) => isBotLogin(authors[a] ?? "")).length;
  const humanContributors = new Set(prAuthors.filter((a) => !isBotLogin(authors[a] ?? ""))).size;
  const rangeAuthors = new Set(prAuthors).size;
  const activeRepos = new Set(prs.map((pr) => pr[0])).size;
  // Averages use the `count` full days before today: today is partial.
  const fullDays = <T,>(series: T[]) => series.slice(series.length - count - 1, series.length - 1);
  const total = (series: number[]) => fullDays(series).reduce((sum, value) => sum + value, 0);
  const botPrs = snapshot.prs.filter((_, index) => isBotLogin(authors[snapshot.prAuthors?.[index] ?? -1] ?? ""));
  const mergedPerDay = total(yearMerged) / count;
  const averageRows: AverageRow[] = [
    { label: "PRs merged", total: total(yearMerged) },
    ...(yearCreated ? [{ label: "PRs created", total: total(yearCreated) }] : []),
    ...(isOrg ? [{ label: "Merged from bots/agents", total: total(sumByDay(yearDays, botPrs, (pr) => pr[3])) }] : []),
    { label: "Lines changed", total: total(yearAdded) + total(yearDeleted) },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8">
        {!standalone && <ScopeTabs scope={scope} range={range} />}
        <h1 className="text-4xl font-bold mb-2">{isOrg ? `${GH_ORG} on GitHub` : "GitHub Stats"}</h1>
        {isOrg && (
          <p className="mb-2 text-muted-foreground">
            Every public pull request in the{" "}
            <a href={`https://github.com/${GH_ORG}`} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">
              {GH_ORG}
            </a>{" "}
            organization over the last year, by humans and by the Hive agents. Pick a range to see the past week, month or year.
            {standalone && (
              <>
                {" "}
                <a href="https://reilly.asia/ghstats" className="underline underline-offset-4">
                  @{GH_LOGIN}'s own stats
                </a>
                .
              </>
            )}
          </p>
        )}
        <p className="text-muted-foreground text-sm">
          Last updated: {generatedAt}
          {error && <span className="text-destructive ml-2">({error})</span>}
        </p>
        <div className="mt-4">
          <RangeTabs range={range} onChange={changeRange} />
        </div>
      </div>

      <div className="space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          <KpiCard
            label={`PRs Created (${short})`}
            value={createdPrs?.length.toLocaleString() ?? "—"}
            subtext={createdPrs === undefined ? "Waiting for the next snapshot" : undefined}
          />
          <KpiCard
            label={`PRs Merged (${short})`}
            value={prs.length.toLocaleString()}
            subtext={`${formatAverage(mergedPerDay)} per day`}
          />
          {isOrg ? (
            <>
              <KpiCard label="Human Contributors" value={humanContributors} subtext={`${rangeAuthors} authors incl. bots`} />
              <KpiCard
                label="Merged from Bots/Agents"
                value={prs.length ? `${Math.round((botMerged / prs.length) * 100)}%` : "—"}
                subtext={`${botMerged.toLocaleString()} PRs`}
              />
              <KpiCard label="Active Repos" value={activeRepos} subtext={`of ${snapshot.profile.publicRepos} public`} />
            </>
          ) : (
            <>
              <KpiCard label="Contributions" value={snapshot.totals?.prs || 0} subtext="Past year" />
              <KpiCard label="Code Review" value={snapshot.totals?.reviews || 0} subtext="Past year" />
              <KpiCard label="Followers" value={snapshot.profile.followers} />
            </>
          )}
        </div>

        {created === null && (
          <p className="text-sm text-muted-foreground">
            PR-created history will appear after the next snapshot refresh.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrendChart
            title="PRs Merged per Day (UTC)"
            values={merged}
            labels={days}
            valueLabel="Merged"
            average={mergedAverage}
            axisLabels={axisLabels}
          />
          <CumulativeChart title="Cumulative PRs Merged (UTC)" daily={merged} days={days} valueLabel="Total merged" />
          {created && (
            <>
              <TrendChart
                title="PRs Created per Day (UTC)"
                values={created}
                labels={days}
                valueLabel="Created"
                average={createdAverage ?? undefined}
                axisLabels={axisLabels}
              />
              <CumulativeChart title="Cumulative PRs Created (UTC)" daily={created} days={days} valueLabel="Total created" />
            </>
          )}
        </div>

        <Averages rows={averageRows} days={count} rangeLabel={rangeLabel} />

        {/* Contribution Calendar */}
        {snapshot.calendar && <ContributionHeatmap {...snapshot.calendar} />}

        {/* Top Repos */}
        {snapshot.repos && <TopRepos repos={snapshot.repos} prs={prs} />}

        {isOrg && <TopAuthors authors={authors} prAuthors={prAuthors} />}

        {/* Time to Merge */}
        <TimeToMerge prs={prs} />

        {/* Punchcard */}
        <Punchcard prs={prs} />

        {/* Lines Changed */}
        <LinesChanged prs={prs} days={days} added={added} deleted={deleted} average={changedAverage} />

        {/* Recent Activity Feed */}
        {(snapshot.recent?.length || 0) > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Merges</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {snapshot.recent.slice(0, 15).map((merge) => (
                <a
                  key={`${merge.repo}-${merge.number}`}
                  href={merge.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 rounded-lg border border-border bg-card p-3 text-sm hover:bg-accent/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{merge.title}</p>
                    <p className="text-muted-foreground text-xs truncate">
                      {merge.repo} #{merge.number}
                      {isOrg && merge.author ? ` · ${merge.author}` : ""}
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs flex-shrink-0">
                    {new Date(merge.mergedAt).toLocaleDateString()}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Live Events Feed */}
        {live?.events && live.events.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {live.events.slice(0, 20).map((event) => (
                <a
                  key={event.id}
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 rounded-lg border border-border bg-card p-3 text-sm hover:bg-muted transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 16%, var(--card))" }}>
                    📦
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{event.verb}</p>
                    <p className="text-muted-foreground text-xs truncate">
                      {event.subject ? `${event.subject} in ` : ""}{event.repo}
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs flex-shrink-0">
                    {new Date(event.at).toLocaleTimeString()}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CumulativeChart({
  title,
  daily,
  days,
  valueLabel,
}: {
  title: string;
  daily: number[];
  days: string[];
  valueLabel: string;
}) {
  return (
    <TrendChart
      title={title}
      values={cumulative(daily)}
      labels={days}
      valueLabel={valueLabel}
      variant="line"
      axisLabels={[days[0], "Today"]}
      details={(index) => [`+${formatCount(daily[index])} that day`]}
    />
  );
}

/** Sum `weight` (default 1) per UTC day of `timestamp` (epoch seconds), aligned with `days`. */
function sumByDay<T>(days: string[], items: T[], timestamp: (item: T) => number, weight: (item: T) => number = () => 1): number[] {
  const indexByDay = new Map(days.map((day, index) => [day, index]));
  const totals = new Array<number>(days.length).fill(0);
  for (const item of items) {
    const index = indexByDay.get(new Date(timestamp(item) * 1000).toISOString().slice(0, 10));
    if (index !== undefined) totals[index] += weight(item);
  }
  return totals;
}

/** Trailing mean; the first days average over the days available. */
function rollingAverage(values: number[], window = AVERAGE_WINDOW_DAYS): number[] {
  let sum = 0;
  return values.map((value, index) => {
    sum += value;
    if (index >= window) sum -= values[index - window];
    return sum / Math.min(window, index + 1);
  });
}

function cumulative(values: number[]): number[] {
  let total = 0;
  return values.map((value) => (total += value));
}
