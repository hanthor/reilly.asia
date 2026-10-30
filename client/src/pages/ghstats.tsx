import { useEffect, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { GhSnapshot, GhLive, GhEvent, PrRow } from "../../../shared/ghstats";

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
const formatAverage = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 });
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
      <h3 className="text-lg font-semibold">Contribution Calendar</h3>
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
}: {
  prs: PrRow[];
  days: string[];
  added: number[];
  deleted: number[];
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
        average={rollingAverage(dailyChanged)}
        scale="log"
        axisLabels={[days[0], "Today"]}
        caption="Additions plus deletions from PRs merged that day."
        details={(index) => [`+${formatCount(dailyAdded[index])} added`, `−${formatCount(dailyDeleted[index])} deleted`]}
      />
    </div>
  );
}

export default function GhStats() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch(`/api/ghstats?t=${Date.now()}`, { cache: "no-store" });
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
        <h1 className="text-4xl font-bold mb-8">GitHub Stats</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <p>Failed to load stats: {error || "No data available"}</p>
        </div>
      </div>
    );
  }

  const createdPrs = snapshot.createdPrs;
  const days = trailingUtcDays();
  const axisLabels: [string, string] = [days[0], "Today"];
  const merged = sumByDay(days, snapshot.prs, (pr) => pr[3]);
  const created = createdPrs === undefined ? null : sumByDay(days, createdPrs, (createdAt) => createdAt);
  const added = sumByDay(days, snapshot.prs, (pr) => pr[3], (pr) => pr[4]);
  const deleted = sumByDay(days, snapshot.prs, (pr) => pr[3], (pr) => pr[5]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">GitHub Stats</h1>
        <p className="text-muted-foreground text-sm">
          Last updated: {generatedAt}
          {error && <span className="text-destructive ml-2">({error})</span>}
        </p>
      </div>

      <div className="space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard
            label="PRs Created (365d)"
            value={createdPrs?.length ?? "—"}
            subtext={createdPrs === undefined ? "Waiting for the next snapshot" : undefined}
          />
          <KpiCard label="PRs Merged (365d)" value={snapshot.prs.length} />
          <KpiCard label="Contributions" value={snapshot.totals?.prs || 0} />
          <KpiCard label="Code Review" value={snapshot.totals?.reviews || 0} />
          <KpiCard label="Followers" value={snapshot.profile.followers} />
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
            average={rollingAverage(merged)}
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
                average={rollingAverage(created)}
                axisLabels={axisLabels}
              />
              <CumulativeChart title="Cumulative PRs Created (UTC)" daily={created} days={days} valueLabel="Total created" />
            </>
          )}
        </div>

        {/* Contribution Calendar */}
        {snapshot.calendar && <ContributionHeatmap {...snapshot.calendar} />}

        {/* Top Repos */}
        {snapshot.repos && <TopRepos repos={snapshot.repos} prs={snapshot.prs} />}

        {/* Time to Merge */}
        <TimeToMerge prs={snapshot.prs} />

        {/* Punchcard */}
        <Punchcard prs={snapshot.prs} />

        {/* Lines Changed */}
        <LinesChanged prs={snapshot.prs} days={days} added={added} deleted={deleted} />

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

/** UTC dates (YYYY-MM-DD) for the trailing 366 days, oldest first, ending today. */
function trailingUtcDays(): string[] {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: 366 }, (_, index) => new Date(todayUtc - (365 - index) * 86_400_000).toISOString().slice(0, 10));
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
