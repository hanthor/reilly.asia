import { useEffect, useState } from "react";
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

function SimpleChart({
  title,
  data,
  max,
  pointLabels,
  rangeLabels,
  variant = "bar",
}: {
  title: string;
  data: number[];
  max?: number;
  pointLabels?: string[];
  rangeLabels?: [string, string];
  variant?: "bar" | "line";
}) {
  const maxVal = max || Math.max(...data, 1);
  const baseline = 104;
  const plotHeight = 92;
  const slotWidth = 1000 / Math.max(data.length, 1);
  const barWidth = Math.min(slotWidth, Math.max(2.2, slotWidth * 0.72));

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <svg
        className="block h-32 w-full text-accent"
        viewBox="0 0 1000 132"
        preserveAspectRatio="none"
        role="img"
        aria-label={title}
      >
        <line x1="0" y1={baseline} x2="1000" y2={baseline} stroke="var(--border)" />
        {variant === "line" ? (
          <>
            <polyline
              points={data
                .map((value, index) => {
                  const x = (index / Math.max(data.length - 1, 1)) * 1000;
                  const y = baseline - (value / maxVal) * plotHeight;
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((value, index) => {
              const x = (index / Math.max(data.length - 1, 1)) * 1000;
              const y = baseline - (value / maxVal) * plotHeight;
              return (
                <circle key={index} cx={x} cy={y} r="5" fill="transparent">
                  <title>{pointLabels?.[index] ? `${pointLabels[index]}: ${value}` : value}</title>
                </circle>
              );
            })}
          </>
        ) : (
          data.map((value, index) => {
            const height = value > 0 ? Math.max((value / maxVal) * plotHeight, 1.5) : 0;
            return (
              <rect
                key={index}
                x={index * slotWidth + (slotWidth - barWidth) / 2}
                y={baseline - height}
                width={barWidth}
                height={height}
                rx="1"
                fill="currentColor"
              >
                <title>{pointLabels?.[index] ? `${pointLabels[index]}: ${value}` : value}</title>
              </rect>
            );
          })
        )}
        {rangeLabels && (
          <>
            <text x="0" y="127" fill="var(--muted-foreground)" fontSize="20">{rangeLabels[0]}</text>
            <text x="1000" y="127" fill="var(--muted-foreground)" fontSize="20" textAnchor="end">{rangeLabels[1]}</text>
          </>
        )}
      </svg>
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
      <SimpleChart
        title="Distribution"
        data={buckets}
        max={Math.max(...buckets)}
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

function LinesChanged({ prs }: { prs: PrRow[] }) {
  const added = prs.reduce((sum, pr) => sum + pr[4], 0);
  const deleted = prs.reduce((sum, pr) => sum + pr[5], 0);
  const totalFiles = prs.reduce((sum, pr) => sum + pr[6], 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Code Changes</h3>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Lines Added" value={added.toLocaleString()} />
        <KpiCard label="Lines Deleted" value={deleted.toLocaleString()} />
        <KpiCard label="Files Changed" value={totalFiles.toLocaleString()} />
      </div>
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

  const dailyMerges = getDailyMerges(snapshot.prs);
  const cumulativeMerges = getCumulativeMerges(dailyMerges);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="PRs Merged" value={snapshot.prs.length} />
          <KpiCard label="Contributions" value={snapshot.totals?.prs || 0} />
          <KpiCard label="Code Review" value={snapshot.totals?.reviews || 0} />
          <KpiCard label="Followers" value={snapshot.profile.followers} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SimpleChart
            title="PRs Merged per Day (UTC)"
            data={dailyMerges.map((day) => day.count)}
            pointLabels={dailyMerges.map((day) => day.date)}
            rangeLabels={[dailyMerges[0].date, "Today"]}
          />
          <SimpleChart
            title="Cumulative PRs Merged (UTC)"
            data={cumulativeMerges}
            pointLabels={dailyMerges.map((day) => day.date)}
            rangeLabels={[dailyMerges[0].date, "Today"]}
            variant="line"
          />
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
        <LinesChanged prs={snapshot.prs} />

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

interface DailyMerge {
  date: string;
  count: number;
}

function getDailyMerges(prs: PrRow[]): DailyMerge[] {
  const dailyCounts = new Map<string, number>();
  for (const pr of prs) {
    const date = new Date(pr[3] * 1000).toISOString().slice(0, 10);
    dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
  }

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Array.from({ length: 366 }, (_, index) => {
    const date = new Date(todayUtc - (365 - index) * 86_400_000).toISOString().slice(0, 10);
    return { date, count: dailyCounts.get(date) ?? 0 };
  });
}

function getCumulativeMerges(dailyMerges: DailyMerge[]): number[] {
  let cumulative = 0;
  return dailyMerges.map(({ count }) => (cumulative += count));
}
