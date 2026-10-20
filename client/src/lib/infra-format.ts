/** Browser-only display helpers for the infrastructure page. */

/** "just now", "12s ago", "3m ago", "2h ago", "4d ago". Future times clamp to "just now". */
export function formatAgo(thenMs: number, nowMs: number): string {
  if (!Number.isFinite(thenMs) || !Number.isFinite(nowMs)) return "—";
  const s = Math.floor((nowMs - thenMs) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export type LatencyTier = "fast" | "ok" | "slow" | "none";

export function latencyTier(ms: number | null | undefined): LatencyTier {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "none";
  if (ms < 400) return "fast";
  if (ms < 1500) return "ok";
  return "slow";
}

/** Counts render as "—" when the API could not produce them. */
export function formatCount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US");
}

export type CiState = "passing" | "failing" | "unknown";

export function ciState(conclusion: string | null | undefined): CiState {
  if (conclusion === "success") return "passing";
  if (conclusion === "failure" || conclusion === "timed_out" || conclusion === "startup_failure") return "failing";
  return "unknown";
}
