// Data contract for /ghstats. Three producers, one consumer:
//   scripts/ghstats.ts (GitHub Action, every 15 min) → the snapshot, uploaded
//     as the `ghstats.json` asset of the `ghstats-data` release
//   worker /ghstats/api/snapshot → that asset, passed through and cached
//   worker /ghstats/api/live     → PRs merged since the snapshot, plus recent
//     public events, from GitHub's anonymous REST API
// The /ghstats page merges the two and aggregates in the visitor's time zone.
// Keep this file dependency-free and free of TS-only runtime syntax: the
// Action runs scripts/ghstats.ts directly with Node's type stripping.

export const GH_LOGIN = "hanthor";
/** The org whose stats stats.tunaos.org and /ghstats?scope=org show. */
export const GH_ORG = "tuna-os";
export const STATS_HOST = "stats.tunaos.org";
export const SNAPSHOT_RELEASE_TAG = "ghstats-data";
export const SNAPSHOT_ASSET = "ghstats.json";
export const ORG_SNAPSHOT_ASSET = "ghstats-org.json";
const RELEASE_BASE = `https://github.com/hanthor/reilly.asia/releases/download/${SNAPSHOT_RELEASE_TAG}/`;
export const SNAPSHOT_URL = RELEASE_BASE + SNAPSHOT_ASSET;
export const ORG_SNAPSHOT_URL = RELEASE_BASE + ORG_SNAPSHOT_ASSET;

/** "user" = hanthor's own PRs anywhere; "org" = every author's PRs in tuna-os. */
export type GhScope = "user" | "org";

export function parseScope(raw: string | null | undefined): GhScope {
  return raw === "org" ? "org" : "user";
}

/** Time window the stats page shows. The snapshots hold one year. */
export type GhRange = "week" | "month" | "year";

export const RANGES: { value: GhRange; label: string; days: number }[] = [
  { value: "week", label: "Past week", days: 7 },
  { value: "month", label: "Past month", days: 30 },
  { value: "year", label: "Past year", days: 365 },
];

export function parseRange(raw: string | null | undefined): GhRange {
  return RANGES.some((range) => range.value === raw) ? (raw as GhRange) : "year";
}

export function rangeDays(range: GhRange): number {
  return RANGES.find((entry) => entry.value === range)!.days;
}

/** UTC dates (YYYY-MM-DD) for the trailing `count` days, oldest first, ending today. */
export function trailingUtcDays(count: number, now = new Date()): string[] {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: count }, (_, index) => new Date(todayUtc - (count - 1 - index) * 86_400_000).toISOString().slice(0, 10));
}

/** Mean days per calendar month (365.25 / 12). */
export const DAYS_PER_MONTH = 30.4375;

/** Average of `total` per day, week and month over a window of `days` days. */
export function periodAverages(total: number, days: number): { day: number; week: number; month: number } {
  const day = days > 0 ? total / days : 0;
  return { day, week: day * 7, month: day * DAYS_PER_MONTH };
}

/** Search qualifier selecting the scope's PRs. */
export function scopeQualifier(scope: GhScope): string {
  return scope === "org" ? `org:${GH_ORG}` : `author:${GH_LOGIN}`;
}

/** Only public PRs: the snapshot and the live overlay both filter on this. */
export const mergedPrQuery = (scope: GhScope) => `${scopeQualifier(scope)} is:pr is:merged is:public`;
/** All public PRs in the scope, including open and closed-unmerged PRs. */
export const createdPrQuery = (scope: GhScope) => `${scopeQualifier(scope)} is:pr is:public`;
export const MERGED_PR_QUERY = mergedPrQuery("user");
export const CREATED_PR_QUERY = createdPrQuery("user");

/** Bot accounts: GitHub Apps end in [bot]; a few automation users do not. */
export function isBotLogin(login: string): boolean {
  return /\[bot\]$/.test(login) || /^(renovate|dependabot|github-actions)(-|$)/i.test(login);
}

/** One merged PR: [repo index, number, createdAt s, mergedAt s, additions, deletions, changed files, merged by author 1/0]. */
export type PrRow = [number, number, number, number, number, number, number, number];

export interface RecentMerge {
  repo: string;
  /** Org snapshots only. */
  author?: string;
  number: number;
  title: string;
  url: string;
  createdAt: string;
  mergedAt: string;
}

export interface GhEvent {
  id: string;
  /** What happened, e.g. "commented on", "merged", "opened issue". */
  verb: string;
  repo: string;
  /** Issue/PR title, branch or tag name; null when the event carries none. */
  subject: string | null;
  url: string;
  at: string;
}

export interface GhSnapshot {
  v: 1;
  /** User login, or the org name for an org snapshot. */
  login: string;
  /** Absent on snapshots written before org support: treat as "user". */
  scope?: GhScope;
  generatedAt: string;
  /** When every PR was last refetched; runs in between only add new merges. */
  fullAt: string;
  profile: { createdAt: string; followers: number; publicRepos: number };
  /** Last year of GitHub's contribution calendar (UTC days). */
  calendar: { start: string; counts: number[] } | null;
  /** Contribution totals for the same year. */
  totals: { commits: number; prs: number; reviews: number; issues: number } | null;
  repos: string[];
  prs: PrRow[];
  /** UTC epoch seconds for public PRs created in the trailing 365 days, merged or not. */
  createdPrs?: number[];
  /** The newest merges, with titles, newest first. */
  recent: RecentMerge[];
  /** Org snapshots: PR author logins, indexed by prAuthors / createdAuthors. */
  authors?: string[];
  /** Org snapshots: author index for each row of prs. */
  prAuthors?: number[];
  events: GhEvent[];
}

export interface GhLive {
  fetchedAt: string;
  since: string;
  /** Null when GitHub's search did not answer. */
  merged: RecentMerge[] | null;
  /** More merges matched than one search page returns. */
  truncated: boolean;
  events: GhEvent[] | null;
}

export const RECENT_LIMIT = 30;
export const EVENT_LIMIT = 40;

/** Clamp a client-supplied ?since= to a 5-minute boundary within the last 3 days. */
export function clampSince(raw: string | null, now: Date): Date {
  const floor = now.getTime() - 3 * 86_400_000;
  const t = raw ? Date.parse(raw) : NaN;
  const ms = Number.isFinite(t) ? Math.min(Math.max(t, floor), now.getTime()) : floor;
  return new Date(Math.floor(ms / 300_000) * 300_000);
}

type Json = Record<string, unknown>;

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function obj(v: unknown): Json | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null;
}

/** A REST /search/issues item → RecentMerge, or null when it is not a merged PR. */
export function mergeFromSearchItem(raw: unknown): RecentMerge | null {
  const item = obj(raw);
  const pr = obj(item?.pull_request);
  const mergedAt = str(pr?.merged_at);
  const repoUrl = str(item?.repository_url);
  const url = str(item?.html_url);
  const createdAt = str(item?.created_at);
  if (!item || !mergedAt || !repoUrl || !url || !createdAt || typeof item.number !== "number") return null;
  const repo = repoUrl.replace(/^https:\/\/api\.github\.com\/repos\//, "");
  const author = str(obj(item.user)?.login) ?? undefined;
  return { repo, number: item.number, title: str(item.title) ?? `#${item.number}`, url, createdAt, mergedAt, ...(author ? { author } : {}) };
}

/** A public event from /users/:login/events/public or /orgs/:org/events → GhEvent, or null for noise (labels, stars of own repos…). */
export function normalizeEvent(raw: unknown): GhEvent | null {
  const e = obj(raw);
  const repo = str(obj(e?.repo)?.name);
  const at = str(e?.created_at);
  const id = str(e?.id);
  const p = obj(e?.payload);
  if (!e || !repo || !at || !id || !p) return null;
  const repoUrl = `https://github.com/${repo}`;
  const issue = obj(p.issue);
  const action = str(p.action);
  switch (e.type) {
    case "PullRequestEvent": {
      if (action !== "opened" && action !== "merged" && action !== "closed" && action !== "reopened") return null;
      const n = typeof p.number === "number" ? p.number : null;
      const pr = obj(p.pull_request);
      return {
        id,
        verb: action === "opened" ? "opened PR" : action === "reopened" ? "reopened PR" : action === "merged" ? "merged" : "closed PR",
        repo,
        subject: str(pr?.title) ?? (n ? `#${n}` : null),
        url: str(pr?.html_url) ?? (n ? `${repoUrl}/pull/${n}` : repoUrl),
        at,
      };
    }
    case "IssueCommentEvent":
      return { id, verb: "commented on", repo, subject: str(issue?.title), url: str(obj(p.comment)?.html_url) ?? str(issue?.html_url) ?? repoUrl, at };
    case "IssuesEvent":
      if (action !== "opened" && action !== "closed" && action !== "reopened") return null;
      return { id, verb: `${action} issue`, repo, subject: str(issue?.title), url: str(issue?.html_url) ?? repoUrl, at };
    case "PullRequestReviewEvent": {
      const pr = obj(p.pull_request);
      return { id, verb: "reviewed", repo, subject: str(pr?.title), url: str(obj(p.review)?.html_url) ?? str(pr?.html_url) ?? repoUrl, at };
    }
    case "PushEvent": {
      const ref = str(p.ref)?.replace(/^refs\/heads\//, "") ?? null;
      return { id, verb: "pushed to", repo, subject: ref, url: repoUrl, at };
    }
    case "CreateEvent":
      if (p.ref_type === "repository") return { id, verb: "created repo", repo, subject: null, url: repoUrl, at };
      if (p.ref_type === "tag") return { id, verb: "tagged", repo, subject: str(p.ref), url: repoUrl, at };
      return null;
    case "ReleaseEvent": {
      const rel = obj(p.release);
      return { id, verb: "released", repo, subject: str(rel?.tag_name) ?? str(rel?.name), url: str(rel?.html_url) ?? repoUrl, at };
    }
    case "ForkEvent":
      return { id, verb: "forked", repo, subject: null, url: repoUrl, at };
    case "WatchEvent":
      return { id, verb: "starred", repo, subject: null, url: repoUrl, at };
    default:
      return null;
  }
}

export function normalizeEvents(raw: unknown): GhEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: GhEvent[] = [];
  for (const r of raw) {
    const e = normalizeEvent(r);
    if (e) out.push(e);
    if (out.length >= EVENT_LIMIT) break;
  }
  return out;
}

/** Shape check for a snapshot fetched by the browser; null when unusable. */
export function parseSnapshot(raw: unknown): GhSnapshot | null {
  const s = obj(raw);
  if (!s || s.v !== 1 || !Array.isArray(s.repos) || !Array.isArray(s.prs) || typeof s.generatedAt !== "string") return null;
  return s as unknown as GhSnapshot;
}
