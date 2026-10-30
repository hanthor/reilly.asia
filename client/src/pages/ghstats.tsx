import { useEffect, useState } from "react";
import type { GhSnapshot, GhLive, GhEvent, PrRow } from "../../../shared/ghstats";
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-muted font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtext && <p className="text-xs text-muted">{subtext}</p>}
    </div>
  );
}

function SimpleChart({
  title,
  data,
  max,
}: {
  title: string;
  data: number[];
  max?: number;
}) {
  const maxVal = max || Math.max(...data, 1);
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex gap-0.5 items-end h-24">
        {data.map((val, i) => (
          <div
            key={i}
            className="flex-1 bg-accent rounded-t-sm min-h-1"
            style={{ height: `${(val / maxVal) * 100}%` }}
            title={`${val}`}
          />
        ))}
      </div>
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contribution Calendar</h3>
      <div className="overflow-x-auto">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${weeks}, 12px)` }}>
          {counts.map((count, i) => {
            const intensity = count === 0 ? 0 : Math.min(4, Math.ceil(count / 10));
            const colors = [
              "bg-surface",
              "bg-success/30",
              "bg-success/50",
              "bg-success/70",
              "bg-success",
            ];
            return (
              <div
                key={i}
                className={cn("h-3 w-3 rounded-sm border border-border", colors[intensity])}
                title={`${count} contributions`}
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{repos[Number(repoIdx)]}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 bg-accent rounded" style={{ width: `${(count / maxCount) * 100}px` }} />
              <span className="text-sm text-muted w-8 text-right">{count}</span>
            </div>
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
        <KpiCard label="Median (days)" value={Math.round(median * 10) / 10} />
        <KpiCard label="P90 (days)" value={Math.round(p90 * 10) / 10} />
        <KpiCard label="Average (days)" value={Math.round(avg * 10) / 10} />
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
                  <div key={h} className="w-4 text-center text-xs text-muted">
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
                  const intensity = count === 0 ? 0 : Math.min(4, Math.ceil((count / maxVal) * 4));
                  const colors = [
                    "bg-surface",
                    "bg-success/30",
                    "bg-success/50",
                    "bg-success/70",
                    "bg-success",
                  ];
                  return (
                    <div
                      key={hour}
                      className={cn("w-4 h-4 rounded-sm border border-border", colors[intensity])}
                      title={`${dayLabels[dow]} ${hour}:00 UTC: ${count} merges`}
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
      const response = await fetch("/api/ghstats");
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
        <p className="text-muted">Loading stats...</p>
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
        <div className="rounded-lg border border-warning bg-warning/10 p-4 text-warning">
          <p>Failed to load stats: {error || "No data available"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">GitHub Stats</h1>
        <p className="text-muted text-sm">
          Last updated: {generatedAt}
          {error && <span className="text-warning ml-2">({error})</span>}
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

        {/* Daily activity and cumulative */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily merges by aggregating PRs by date */}
          <SimpleChart
            title="PRs Merged (by Day)"
            data={getDailyMerges(snapshot.prs)}
          />
          <SimpleChart
            title="Cumulative PRs Merged"
            data={getCumulativeMerges(snapshot.prs)}
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
                  className="flex gap-3 rounded-lg border border-border bg-surface p-3 text-sm hover:bg-surface/80 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{merge.title}</p>
                    <p className="text-muted text-xs truncate">
                      {merge.repo} #{merge.number}
                    </p>
                  </div>
                  <p className="text-muted text-xs flex-shrink-0">
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
                  className="flex gap-3 rounded-lg border border-border bg-surface p-3 text-sm hover:bg-surface/80 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs">
                    📦
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{event.verb}</p>
                    <p className="text-muted text-xs truncate">
                      {event.subject ? `${event.subject} in ` : ""}{event.repo}
                    </p>
                  </div>
                  <p className="text-muted text-xs flex-shrink-0">
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

function getDailyMerges(prs: PrRow[]): number[] {
  const dailyMap: Record<string, number> = {};
  for (const pr of prs) {
    const date = new Date(pr[3] * 1000).toISOString().split("T")[0];
    dailyMap[date] = (dailyMap[date] || 0) + 1;
  }

  // Get sorted unique dates and convert to array
  const dates = Object.keys(dailyMap).sort();
  return dates.map((d) => dailyMap[d]);
}

function getCumulativeMerges(prs: PrRow[]): number[] {
  const sorted = [...prs].sort((a, b) => a[3] - b[3]);
  const result: number[] = [];
  let cumulative = 0;
  for (const pr of sorted) {
    cumulative++;
    result.push(cumulative);
  }
  return result;
}
