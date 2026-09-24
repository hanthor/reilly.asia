// Types and pure helpers shared by the Worker's /infra/api/* endpoints and the
// /infra landing page. Keep this file dependency-free: it is bundled into both.

export type EndpointGroup = "hive" | "matrix";

export interface EndpointStatus {
  /** Human name, e.g. "School Hive". */
  name: string;
  /** Hostname shown on the page. Never the full probe URL. */
  label: string;
  group: EndpointGroup;
  /** true = 2xx, false = error/timeout/non-2xx, null = not measured. */
  up: boolean | null;
  latencyMs: number | null;
}

export interface PublicEndpoint {
  name: string;
  label: string;
  group: EndpointGroup;
  /** Unauthenticated path probed on https://<label>. */
  path: string;
}

// Public, unauthenticated health endpoints. The Worker probes these; the page
// uses the same list for its loading skeleton and "unknown" fallback.
export const PUBLIC_ENDPOINTS: readonly PublicEndpoint[] = [
  { name: "School Hive", label: "hive.tunaos.org", group: "hive", path: "/api/health" },
  { name: "Reef Hive", label: "reef.tunaos.org", group: "hive", path: "/api/health" },
  { name: "Hive hub", label: "hub.tunaos.org", group: "hive", path: "/" },
  { name: "Personal Hive", label: "hive.reilly.asia", group: "hive", path: "/api/health" },
  { name: "Synapse homeserver", label: "matrix.reilly.asia", group: "matrix", path: "/_matrix/client/versions" },
  { name: "Matrix auth (MAS)", label: "auth.reilly.asia", group: "matrix", path: "/.well-known/openid-configuration" },
  { name: "MatrixRTC calls", label: "call.reilly.asia", group: "matrix", path: "/" },
];

export interface StatusPayload {
  checkedAt: string;
  endpoints: EndpointStatus[];
  hive: {
    /** Upstream hivecommons/hive latest release tag, e.g. "v5.35.5". */
    latestRelease: string | null;
    releaseUrl: string | null;
  };
}

export interface ActivityPayload {
  windowDays: number;
  fetchedAt: string;
  mergedTotal: number | null;
  mergedRenovate: number | null;
  mergedHive: number | null;
  ci: {
    /** GitHub Actions conclusion of the latest completed CI run on master. */
    conclusion: string | null;
    url: string | null;
    at: string | null;
  };
}

export type OverallState = "operational" | "degraded" | "down" | "unknown";

export interface StatusSummary {
  up: number;
  down: number;
  unknown: number;
  total: number;
  state: OverallState;
}

export function summarize(endpoints: readonly Pick<EndpointStatus, "up">[]): StatusSummary {
  let up = 0;
  let down = 0;
  let unknown = 0;
  for (const e of endpoints) {
    if (e.up === true) up++;
    else if (e.up === false) down++;
    else unknown++;
  }
  const total = endpoints.length;
  let state: OverallState;
  if (total === 0 || unknown === total) state = "unknown";
  else if (up === total) state = "operational";
  else if (up === 0 && unknown === 0) state = "down";
  else state = "degraded";
  return { up, down, unknown, total, state };
}

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

/** Extract a release tag from a github.com/.../releases/tag/<tag> URL. */
export function tagFromReleaseUrl(location: string | null | undefined): string | null {
  if (!location) return null;
  const m = /\/releases\/tag\/([^/?#]+)/.exec(location);
  return m ? decodeURIComponent(m[1]) : null;
}

export type CiState = "passing" | "failing" | "unknown";

export function ciState(conclusion: string | null | undefined): CiState {
  if (conclusion === "success") return "passing";
  if (conclusion === "failure" || conclusion === "timed_out" || conclusion === "startup_failure") return "failing";
  return "unknown";
}
