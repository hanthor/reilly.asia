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
export const SNAPSHOT_RELEASE_TAG = "ghstats-data";
export const SNAPSHOT_ASSET = "ghstats.json";
export const SNAPSHOT_URL = `https://github.com/hanthor/reilly.asia/releases/download/${SNAPSHOT_RELEASE_TAG}/${SNAPSHOT_ASSET}`;

/** Only public PRs: the snapshot and the live overlay both filter on this. */
export const MERGED_PR_QUERY = `author:${GH_LOGIN} is:pr is:merged is:public`;

/** One merged PR: [repo index, number, createdAt s, mergedAt s, additions, deletions, changed files, merged by author 1/0]. */
export type PrRow = [number, number, number, number, number, number, number, number];

export interface RecentMerge {
  repo: string;
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
  login: string;
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
  /** The newest merges, with titles, newest first. */
  recent: RecentMerge[];
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
  return { repo, number: item.number, title: str(item.title) ?? `#${item.number}`, url, createdAt, mergedAt };
}

/** A public event from /users/:login/events/public → GhEvent, or null for noise (labels, stars of own repos…). */
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
