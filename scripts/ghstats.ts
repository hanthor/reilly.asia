#!/usr/bin/env node
// Fetch and aggregate GitHub PR stats for a full year, write a snapshot JSON.
// Two scopes: `--scope user` (default; hanthor's PRs anywhere) and
// `--scope org` (every public PR in the tuna-os org, by any author).
// Runs on a schedule (e.g., hourly via GitHub Actions) and commits the output
// to a release asset ghstats.json so the Worker and /ghstats page can use it.
//
// Fetches:
// 1. All merged PRs by the user in the last 365 days via GraphQL (paged, 7-day windows)
// 2. All created PRs (open, closed, or merged) in the same range and windows
// 3. User profile (createdAt, followers, publicRepos)
// 4. Contribution calendar
// 5. Recent merges with titles (REST search, for the feed)
// 6. Recent public events
//
// No TypeScript runtime deps; run directly with `node --input-type=module` or
// Node 20.6+ with a .mts extension.

import { setTimeout as sleep } from "node:timers/promises";
import {
  GH_LOGIN,
  GH_ORG,
  mergedPrQuery,
  createdPrQuery,
  parseScope,
  type GhSnapshot,
  type PrRow,
  type RecentMerge,
  mergeFromSearchItem,
  normalizeEvents,
  type GhEvent,
  RECENT_LIMIT,
} from "../shared/ghstats.ts";

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL = "https://api.github.com/graphql";

const scopeArg = process.argv.indexOf("--scope");
const SCOPE = parseScope(scopeArg >= 0 ? process.argv[scopeArg + 1] : "user");
const MERGED_PR_QUERY = mergedPrQuery(SCOPE);
const CREATED_PR_QUERY = createdPrQuery(SCOPE);

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN not set");

const headers = {
  Authorization: `Bearer ${token}`,
  "User-Agent": "ghstats-aggregator",
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

type Json = Record<string, unknown>;

const GQL_ATTEMPTS = 4;

async function gql<T>(query: string, variables: Json = {}): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });
    const text = await res.text();
    let body: { data?: T; errors?: unknown[] } | null = null;
    if (res.ok) {
      try {
        body = JSON.parse(text) as { data?: T; errors?: unknown[] };
      } catch {
        body = null;
      }
    }
    // GitHub's search API intermittently times out heavy pages as 502/503/504
    // or a truncated 200 body.
    const transient = res.status === 502 || res.status === 503 || res.status === 504 || (res.ok && body === null);
    if (transient && attempt < GQL_ATTEMPTS) {
      console.warn(`GraphQL ${res.ok ? "truncated response" : res.status}; retrying (${attempt}/${GQL_ATTEMPTS - 1})`);
      await sleep(attempt * 2_000);
      continue;
    }
    if (!res.ok || body === null) {
      throw new Error(`GraphQL error ${res.status}: ${text.slice(0, 200)}`);
    }
    if (body.errors) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors).slice(0, 200)}`);
    return body.data!;
  }
}

async function rest<T>(path: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST error ${res.status} ${path}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

interface PullRequest {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  mergedAt: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  mergedBy: { login: string } | null;
  author: { __typename?: string; login: string } | null;
  repository: { nameWithOwner: string };
}

interface CreatedPullRequest {
  number: number;
  createdAt: string;
  repository: { nameWithOwner: string };
}

/** GitHub GraphQL response types for contribution calendar. */
interface ContributionCalendarDay {
  contributionCount: number;
  date: string; // ISO 8601 format, e.g., "2024-01-15"
}

interface ContributionCalendarWeek {
  firstDay: string; // ISO 8601 date format
  contributionDays: ContributionCalendarDay[];
}

/** GitHub search returns at most 1000 results per query; peaks exceed that over 30 days. */
const SEARCH_RESULT_CAP = 1000;
const SEARCH_WINDOW_DAYS = 7;

const DAY_MS = 86_400_000;

/** Inclusive UTC ranges covering the trailing 365 days, newest first. Each
 *  runs from 00:00:00 of its first day to 23:59:59 of its last, so whole-day
 *  qualifiers and the ISO halves of a split window cover the same instants. */
function searchWindows(now: Date): Array<[Date, Date]> {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const windows: Array<[Date, Date]> = [];
  for (let daysBack = 0; daysBack < 365; daysBack += SEARCH_WINDOW_DAYS) {
    const windowDays = Math.min(SEARCH_WINDOW_DAYS, 365 - daysBack);
    const lastDay = today - daysBack * DAY_MS;
    windows.push([new Date(lastDay - (windowDays - 1) * DAY_MS), new Date(lastDay + DAY_MS - 1000)]);
  }
  return windows;
}

const isDayStart = (d: Date) => d.getTime() % DAY_MS === 0;
const isDayEnd = (d: Date) => (d.getTime() + 1000) % DAY_MS === 0;

/** A search range qualifier: whole days when the range is day-aligned, else ISO times. */
function rangeQualifier(start: Date, end: Date): string {
  if (isDayStart(start) && isDayEnd(end)) {
    return `${start.toISOString().slice(0, 10)}..${end.toISOString().slice(0, 10)}`;
  }
  const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
  return `${iso(start)}..${iso(end)}`;
}

type SearchPage<N> = {
  search: { issueCount: number; pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: N[] };
  rateLimit: { remaining: number; resetAt: string };
};

/** Every node of a search, splitting [start, end] until each part is under GitHub's 1000-result cap. */
async function searchAll<N>(base: string, field: "merged" | "created", start: Date, end: Date, gqlQuery: string, depth = 0): Promise<N[]> {
  const q = `${base} ${field}:${rangeQualifier(start, end)}`;
  let cursor: string | null = null;
  const out: N[] = [];
  for (let page = 1; page <= 10; page++) {
    const result: SearchPage<N> = await gql<SearchPage<N>>(gqlQuery, { q, first: 100, after: cursor });
    if (page === 1 && result.search.issueCount > SEARCH_RESULT_CAP) {
      const span = end.getTime() - start.getTime();
      if (span <= 60_000 || depth > 16) assertUnderSearchCap(q, result.search.issueCount);
      const mid = new Date(start.getTime() + Math.ceil(span / 2 / 1000) * 1000);
      const left = await searchAll<N>(base, field, start, new Date(mid.getTime() - 1000), gqlQuery, depth + 1);
      const right = await searchAll<N>(base, field, mid, end, gqlQuery, depth + 1);
      return left.concat(right);
    }
    out.push(...(result.search.nodes ?? []));
    if (result.rateLimit.remaining < 200) {
      const wait = Math.max(0, Date.parse(result.rateLimit.resetAt) - Date.now()) + 5_000;
      console.warn(`Rate limit low (${result.rateLimit.remaining}); waiting ${Math.round(wait / 1000)}s`);
      await sleep(wait);
    }
    if (!result.search.pageInfo.hasNextPage) break;
    cursor = result.search.pageInfo.endCursor ?? null;
  }
  return out;
}

function assertUnderSearchCap(query: string, issueCount: number) {
  if (issueCount > SEARCH_RESULT_CAP) {
    throw new Error(`Search window exceeds ${SEARCH_RESULT_CAP} results (${issueCount}): ${query}`);
  }
}

/** Fetch all merged PRs in the scope from the last 365 days, via GraphQL. */
async function fetchMergedPrs(now: Date): Promise<PullRequest[]> {
  const since = now.getTime() - 365 * DAY_MS;
  const unique = new Map<string, PullRequest>();
  const query = `query($q:String!,$first:Int!,$after:String){search(type:ISSUE,query:$q,first:$first,after:$after){issueCount pageInfo{hasNextPage endCursor} nodes{... on PullRequest{number title url createdAt mergedAt additions deletions changedFiles mergedBy{login} author{__typename login} repository{nameWithOwner}}}} rateLimit{remaining resetAt}}`;
  for (const [start, end] of searchWindows(now)) {
    for (const pr of await searchAll<PullRequest>(MERGED_PR_QUERY, "merged", start, end, query)) {
      if (!pr?.repository || Date.parse(pr.mergedAt) < since) continue;
      unique.set(`${pr.repository.nameWithOwner}#${pr.number}`, pr);
    }
  }
  return [...unique.values()].sort((a, b) => b.number - a.number);
}

/** Fetch all public PRs in the scope created in the last 365 days, regardless of merge status. */
async function fetchCreatedPrs(now: Date): Promise<number[]> {
  const since = now.getTime() - 365 * DAY_MS;
  const seen = new Map<string, number>();
  const query = `query($q:String!,$first:Int!,$after:String){search(type:ISSUE,query:$q,first:$first,after:$after){issueCount pageInfo{hasNextPage endCursor} nodes{... on PullRequest{number createdAt repository{nameWithOwner}}}} rateLimit{remaining resetAt}}`;
  for (const [start, end] of searchWindows(now)) {
    for (const pr of await searchAll<CreatedPullRequest>(CREATED_PR_QUERY, "created", start, end, query)) {
      if (!pr?.repository) continue;
      const createdAt = Date.parse(pr.createdAt);
      if (createdAt >= since) seen.set(`${pr.repository.nameWithOwner}#${pr.number}`, Math.floor(createdAt / 1000));
    }
  }
  return [...seen.values()].sort((a, b) => a - b);
}

/** Org profile: no contribution calendar or totals; GitHub keeps those per user. */
async function fetchOrgProfile() {
  const org = await rest<{ created_at: string; followers: number; public_repos: number }>(`/orgs/${GH_ORG}`);
  return {
    login: GH_ORG,
    createdAt: org.created_at,
    followers: org.followers,
    publicRepos: org.public_repos,
    calendar: null,
    totals: null,
  };
}

/** Fetch the user's profile and contribution calendar. */
async function fetchProfile(now: Date) {
  const result = await gql<{
    user: {
      login: string;
      createdAt: string;
      followers: { totalCount: number };
      repositories: { totalCount: number };
      contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalPullRequestReviewContributions: number;
        totalIssueContributions: number;
        contributionCalendar: { totalContributions: number; weeks: ContributionCalendarWeek[] };
      };
    };
  }>(
    `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){createdAt followers{totalCount} repositories(first:1){totalCount} contributionsCollection(from:$from,to:$to){totalCommitContributions totalPullRequestContributions totalPullRequestReviewContributions totalIssueContributions contributionCalendar{totalContributions weeks{firstDay contributionDays{contributionCount date}}}}}}`,
    {
      login: GH_LOGIN,
      from: new Date(now.getTime() - 364 * 86_400_000).toISOString().slice(0, 10) + "T00:00:00Z",
      to: now.toISOString(),
    },
  );

  const user = result.user;
  const cc = user.contributionsCollection.contributionCalendar;
  const calendar = { start: "", counts: (cc.weeks as unknown as ContributionCalendarWeek[]).flatMap((w) => w.contributionDays.map((d) => d.contributionCount)) };

  // Get the start date from the first week.
  if (cc.weeks && cc.weeks.length > 0) {
    const firstWeek = cc.weeks[0] as unknown as ContributionCalendarWeek;
    if (firstWeek?.firstDay) calendar.start = firstWeek.firstDay;
  }

  return {
    login: user.login,
    createdAt: user.createdAt,
    followers: user.followers.totalCount,
    publicRepos: user.repositories.totalCount,
    calendar: calendar.counts.length > 0 ? calendar : null,
    totals: {
      commits: user.contributionsCollection.totalCommitContributions,
      prs: user.contributionsCollection.totalPullRequestContributions,
      reviews: user.contributionsCollection.totalPullRequestReviewContributions,
      issues: user.contributionsCollection.totalIssueContributions,
    },
  };
}

/** Fetch recent merged PRs with titles from REST search for the feed. */
async function fetchRecentMerges(since: Date): Promise<RecentMerge[]> {
  const query = `${MERGED_PR_QUERY} merged:>=${since.toISOString().slice(0, 10)}`;
  const result = await rest<{ items?: unknown[] }>(`/search/issues?q=${encodeURIComponent(query)}&per_page=${RECENT_LIMIT}&sort=updated&order=desc`);
  const out: RecentMerge[] = [];
  for (const item of result.items ?? []) {
    const m = mergeFromSearchItem(item);
    if (m) out.push(m);
    if (out.length >= RECENT_LIMIT) break;
  }
  return out;
}

/** Fetch recent public events for the activity feed. */
async function fetchRecentEvents(): Promise<GhEvent[]> {
  const path = SCOPE === "org" ? `/orgs/${GH_ORG}/events?per_page=100` : `/users/${GH_LOGIN}/events/public?per_page=100`;
  const result = await rest<unknown[]>(path);
  return normalizeEvents(result);
}

async function main() {
  const now = new Date();
  const login = SCOPE === "org" ? GH_ORG : GH_LOGIN;
  console.error(`Fetching GitHub stats for ${SCOPE} ${login} at ${now.toISOString()}`);

  // Sequential search phases for the org: in parallel they trip GitHub's
  // secondary rate limit on search.
  const prs = await fetchMergedPrs(now);
  const createdPrs = await fetchCreatedPrs(now);
  const [profile, recent, events] = await Promise.all([
    SCOPE === "org" ? fetchOrgProfile() : fetchProfile(now),
    fetchRecentMerges(new Date(now.getTime() - 7 * 86_400_000)), // last 7 days
    fetchRecentEvents(),
  ]);

  console.error(`Fetched ${prs.length} merged PRs and ${createdPrs.length} created PRs, ${recent.length} recent with titles, ${events.length} events`);

  // Build the repos list and PR rows.
  const repos = new Map<string, number>();
  const prRows: PrRow[] = [];
  const authors = new Map<string, number>();
  const prAuthors: number[] = [];

  for (const pr of prs) {
    const repo = pr.repository.nameWithOwner;
    if (!repos.has(repo)) {
      repos.set(repo, repos.size);
    }
    const repoIdx = repos.get(repo)!;
    const createdAt = Math.floor(Date.parse(pr.createdAt) / 1000);
    const mergedAt = Math.floor(Date.parse(pr.mergedAt) / 1000);
    const mergedByHanthor = pr.mergedBy?.login === GH_LOGIN ? 1 : 0;
    prRows.push([repoIdx, pr.number, createdAt, mergedAt, pr.additions, pr.deletions, pr.changedFiles, mergedByHanthor]);
    // GraphQL drops the "[bot]" suffix that REST and the web UI show for Apps.
    const login = pr.author?.login ?? "ghost";
    const author = pr.author?.__typename === "Bot" && !login.endsWith("[bot]") ? `${login}[bot]` : login;
    if (!authors.has(author)) authors.set(author, authors.size);
    prAuthors.push(authors.get(author)!);
  }

  const snapshot: GhSnapshot = {
    v: 1,
    login,
    scope: SCOPE,
    generatedAt: now.toISOString(),
    fullAt: now.toISOString(),
    profile: { createdAt: profile.createdAt, followers: profile.followers, publicRepos: profile.publicRepos },
    calendar: profile.calendar ? { start: profile.calendar.start || "", counts: profile.calendar.counts } : null,
    totals: profile.totals,
    repos: Array.from(repos.keys()),
    prs: prRows,
    createdPrs,
    recent,
    events,
    ...(SCOPE === "org" ? { authors: [...authors.keys()], prAuthors } : {}),
  };

  // The org snapshot holds ~10k rows: keep it compact.
  const json = SCOPE === "org" ? JSON.stringify(snapshot) : JSON.stringify(snapshot, null, 2);
  console.error(`Snapshot size: ${json.length} bytes`);
  console.error(`PRs: ${prRows.length}, created PRs: ${createdPrs.length}, Repos: ${repos.size}, Recent: ${recent.length}, Events: ${events.length}`);
  // stdout is the JSON asset consumed by the workflow.
  console.log(json);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
