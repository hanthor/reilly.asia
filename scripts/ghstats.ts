#!/usr/bin/env node
// Fetch and aggregate GitHub PR stats for a full year, write a snapshot JSON.
// Runs on a schedule (e.g., hourly via GitHub Actions) and commits the output
// to a release asset ghstats.json so the Worker and /ghstats page can use it.
//
// Fetches:
// 1. All merged PRs by the user in the last 365 days via GraphQL (paged, windowed by month)
// 2. User profile (createdAt, followers, publicRepos)
// 3. Contribution calendar
// 4. Recent merges with titles (REST search, for the feed)
// 5. Recent public events
//
// No TypeScript runtime deps; run directly with `node --input-type=module` or
// Node 20.6+ with a .mts extension.

import {
  GH_LOGIN,
  MERGED_PR_QUERY,
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

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN not set");

const headers = {
  Authorization: `Bearer ${token}`,
  "User-Agent": "ghstats-aggregator",
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

type Json = Record<string, unknown>;

async function gql<T>(query: string, variables: Json = {}): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GraphQL error ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as { data?: T; errors?: unknown[] };
  if (body.errors) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors).slice(0, 200)}`);
  return body.data!;
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

/** Fetch all merged PRs authored by hanthor in the last 365 days, via GraphQL. */
async function fetchMergedPrs(now: Date): Promise<PullRequest[]> {
  const since = now.getTime() - 365 * 86_400_000;
  const out: PullRequest[] = [];
  const seen = new Set<string>();

  // Fetch the exact trailing 365-day range in 30-day windows.
  for (let month = 0; month <= 12; month++) {
    const daysBack = month * 30;
    if (daysBack >= 365) break;

    const windowDays = Math.min(30, 365 - daysBack);
    const end = new Date(now.getTime() - daysBack * 86_400_000);
    const start = new Date(end.getTime() - windowDays * 86_400_000);
    const endStr = end.toISOString().slice(0, 10);
    const startStr = start.toISOString().slice(0, 10);
    const query = `${MERGED_PR_QUERY} merged:${startStr}..${endStr}`;

    let cursor: string | null = null;
    let pageNum = 0;
    let hasMore = true;

    while (hasMore && pageNum < 20) {
      pageNum++;
      const variables = { q: query, first: 100, after: cursor };
      const result = await gql<{
        search: { issueCount: number; pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: unknown[] };
        rateLimit: { remaining: number; resetAt: string };
      }>(
        `query($q:String!,$first:Int!,$after:String){search(type:ISSUE,query:$q,first:$first,after:$after){issueCount pageInfo{hasNextPage endCursor} nodes{... on PullRequest{number title url createdAt mergedAt additions deletions changedFiles mergedBy{login} repository{nameWithOwner}}}} rateLimit{remaining resetAt}}`,
        variables,
      );

      const nodes = (result.search.nodes ?? []) as PullRequest[];
      for (const pr of nodes) {
        const key = `${pr.repository.nameWithOwner}#${pr.number}`;
        if (Date.parse(pr.mergedAt) >= since && !seen.has(key)) {
          out.push(pr);
          seen.add(key);
        }
      }
      hasMore = result.search.pageInfo.hasNextPage;
      cursor = result.search.pageInfo.endCursor ?? null;
      if (result.rateLimit.remaining < 200) {
        console.warn(`Rate limit low: ${result.rateLimit.remaining}`);
        break;
      }
    }
  }

  // Unique by repository and PR number.
  const unique: Record<string, PullRequest> = {};
  for (const pr of out) {
    const key = `${pr.repository.nameWithOwner}#${pr.number}`;
    unique[key] = pr;
  }
  return Object.values(unique).sort((a, b) => b.number - a.number);
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
  const result = await rest<unknown[]>(`/users/${GH_LOGIN}/events/public?per_page=100`);
  return normalizeEvents(result);
}

async function main() {
  const now = new Date();
  console.error(`Fetching GitHub stats for ${GH_LOGIN} at ${now.toISOString()}`);

  const [prs, profile, recent, events] = await Promise.all([
    fetchMergedPrs(now),
    fetchProfile(now),
    fetchRecentMerges(new Date(now.getTime() - 7 * 86_400_000)), // last 7 days
    fetchRecentEvents(),
  ]);

  console.error(`Fetched ${prs.length} merged PRs, ${recent.length} recent with titles, ${events.length} events`);

  // Build the repos list and PR rows.
  const repos = new Map<string, number>();
  const prRows: PrRow[] = [];

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
  }

  const snapshot: GhSnapshot = {
    v: 1,
    login: GH_LOGIN,
    generatedAt: now.toISOString(),
    fullAt: now.toISOString(),
    profile: { createdAt: profile.createdAt, followers: profile.followers, publicRepos: profile.publicRepos },
    calendar: profile.calendar ? { start: profile.calendar.start || "", counts: profile.calendar.counts } : null,
    totals: profile.totals,
    repos: Array.from(repos.keys()),
    prs: prRows,
    recent,
    events,
  };

  const json = JSON.stringify(snapshot, null, 2);
  console.error(`Snapshot size: ${json.length} bytes`);
  console.error(`PRs: ${prRows.length}, Repos: ${repos.size}, Recent: ${recent.length}, Events: ${events.length}`);
  // stdout is the JSON asset consumed by the workflow.
  console.log(json);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
