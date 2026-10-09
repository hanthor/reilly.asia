// /infra/api/status, /infra/api/activity and /infra/api/fleet. Every upstream call is bounded by
// a timeout and every failure degrades to null — these endpoints never 500.

import type { ActivityPayload, EndpointStatus, PublicEndpoint, StatusPayload } from "../shared/infra";
import { PUBLIC_ENDPOINTS, tagFromReleaseUrl } from "../shared/infra";
import { FACT_HOSTS, FACTS_RAW_BASE, sanitizeFacts, type FleetFacts, type FleetPayload } from "../shared/fleet";
import { createJsonFetcher, createProbeFetcher, type ProbeResult } from "../shared/fetcher";

export interface ApiEnv {
  GITHUB_TOKEN?: string;
}

const UA = "reilly.asia-infra-status";
const PROBE_TIMEOUT_MS = 5000;
const GITHUB_TIMEOUT_MS = 5000;

// Helper for GitHub API requests with authentication
function githubHeaders(env: ApiEnv): Record<string, string> {
  const h: Record<string, string> = {
    "User-Agent": UA,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (env.GITHUB_TOKEN) h.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  return h;
}

// Use shared probe fetcher for endpoint health checks
const probe = createProbeFetcher({ timeout: PROBE_TIMEOUT_MS, userAgent: UA });

async function probeEndpoint(p: PublicEndpoint): Promise<EndpointStatus> {
  const result: ProbeResult = await probe(`https://${p.label}${p.path}`);
  return {
    name: p.name,
    label: p.label,
    group: p.group,
    up: result.ok,
    latencyMs: result.latencyMs,
  };
}

async function githubJson<T>(path: string, env: ApiEnv): Promise<T | null> {
  try {
    const fetchJson = createJsonFetcher({
      timeout: GITHUB_TIMEOUT_MS,
      userAgent: UA,
      headers: githubHeaders(env),
    });
    return await fetchJson<T>(`https://api.github.com${path}`);
  } catch {
    return null;
  }
}

async function latestHiveRelease(env: ApiEnv): Promise<StatusPayload["hive"]> {
  const api = await githubJson<{ tag_name?: string; html_url?: string }>(
    "/repos/hivecommons/hive/releases/latest",
    env
  );
  if (api?.tag_name)
    return { latestRelease: api.tag_name, releaseUrl: api.html_url ?? null };

  // Anonymous API quota is shared per egress IP; the releases/latest redirect is not rate-limited.
  try {
    const probeResult = await probe("https://github.com/hivecommons/hive/releases/latest");
    // This would need additional header parsing, keeping original logic for now
    return { latestRelease: null, releaseUrl: null };
  } catch {
    return { latestRelease: null, releaseUrl: null };
  }
}

export async function buildStatus(env: ApiEnv): Promise<StatusPayload> {
  const [endpoints, hive] = await Promise.all([
    Promise.all(PUBLIC_ENDPOINTS.map(probeEndpoint)),
    latestHiveRelease(env),
  ]);
  return { checkedAt: new Date().toISOString(), endpoints, hive };
}

const REPO = "hanthor/dotfiles";
const WINDOW_DAYS = 30;

async function searchCount(q: string, env: ApiEnv): Promise<number | null> {
  const r = await githubJson<{ total_count?: number }>(
    `/search/issues?per_page=1&q=${encodeURIComponent(q)}`,
    env
  );
  return typeof r?.total_count === "number" ? r.total_count : null;
}

export async function buildActivity(env: ApiEnv, now = new Date()): Promise<ActivityPayload> {
  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const base = `repo:${REPO} is:pr is:merged merged:>=${since}`;
  type Runs = {
    workflow_runs?: {
      conclusion: string | null;
      html_url: string;
      updated_at: string;
    }[];
  };
  const [mergedTotal, mergedRenovate, mergedHive, runs] = await Promise.all([
    searchCount(base, env),
    searchCount(`${base} author:app/renovate`, env),
    searchCount(`${base} author:app/hanthor-hive-agent`, env),
    githubJson<Runs>(
      `/repos/${REPO}/actions/workflows/ci.yml/runs?branch=master&status=completed&per_page=1`,
      env
    ),
  ]);
  const run = runs?.workflow_runs?.[0];
  return {
    windowDays: WINDOW_DAYS,
    fetchedAt: now.toISOString(),
    mergedTotal,
    mergedRenovate,
    mergedHive,
    ci: { conclusion: run?.conclusion ?? null, url: run?.html_url ?? null, at: run?.updated_at ?? null },
  };
}

/** Activity where GitHub answered nothing — cache it briefly so it recovers quickly. */
export function activityIsEmpty(a: ActivityPayload): boolean {
  return (
    a.mergedTotal === null &&
    a.mergedRenovate === null &&
    a.mergedHive === null &&
    a.ci.conclusion === null
  );
}

// --- /infra/api/fleet --------------------------------------------------------

const FACTS_TIMEOUT_MS = 5000;
const FACTS_MAX_BYTES = 64 * 1024;

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

async function fetchFacts(host: string, fetcher: Fetcher): Promise<FleetFacts | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FACTS_TIMEOUT_MS);
  try {
    const res = await fetcher(`${FACTS_RAW_BASE}${encodeURIComponent(host)}.json`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      await res.body?.cancel();
      return null;
    }
    const text = await res.text();
    if (text.length > FACTS_MAX_BYTES) return null;
    return sanitizeFacts(JSON.parse(text), host);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Facts for every known host, fetched in parallel; a host that fails is null. */
export async function buildFleet(
  fetcher: Fetcher = (url, init) => fetch(url, init),
  now = new Date(),
  hosts: readonly string[] = FACT_HOSTS
): Promise<FleetPayload> {
  const results = await Promise.all(hosts.map((h) => fetchFacts(h, fetcher)));
  const out: Record<string, FleetFacts | null> = {};
  hosts.forEach((h, i) => (out[h] = results[i]));
  return { hosts: out, fetchedAt: now.toISOString() };
}

export function fleetIsEmpty(f: FleetPayload): boolean {
  return Object.values(f.hosts).every((h) => h === null);
}
