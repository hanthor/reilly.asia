// API contracts and pure helpers shared by the Worker's /infra/api/* endpoints and the
// /infra landing page. Keep presentation formatting in client/src/lib/infra-formatters.ts.

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
  { name: "School Hive", label: "school.tunaos.org", group: "hive", path: "/api/health" },
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

/** Extract a release tag from a github.com/.../releases/tag/<tag> URL. */
export function tagFromReleaseUrl(location: string | null | undefined): string | null {
  if (!location) return null;
  const m = /\/releases\/tag\/([^/?#]+)/.exec(location);
  return m ? decodeURIComponent(m[1]) : null;
}
