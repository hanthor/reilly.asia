// /infra/api/status, /infra/api/activity and /infra/api/fleet. Every upstream call is bounded by
// a timeout and every failure degrades to null — these endpoints never 500.

import type { ActivityPayload, EndpointStatus, PublicEndpoint, StatusPayload } from "../shared/infra";
import { PUBLIC_ENDPOINTS, tagFromReleaseUrl } from "../shared/infra";
import { FACT_HOSTS, FACTS_RAW_BASE, sanitizeFacts, type FleetFacts, type FleetPayload } from "../shared/fleet";

export interface ApiEnv {
  GITHUB_TOKEN?: string;
}

const UA = "reilly.asia-infra-status";
const PROBE_TIMEOUT_MS = 5000;
const GITHUB_TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function probe(p: PublicEndpoint): Promise<EndpointStatus> {
  const started = Date.now();
  try {
    const res = await fetchWithTimeout(
      `https://${p.label}${p.path}`,
      { headers: { "User-Agent": UA }, redirect: "manual", cache: "no-store" },
      PROBE_TIMEOUT_MS,
    );
    const latencyMs = Date.now() - started;
    await res.body?.cancel();
    return { name: p.name, label: p.label, group: p.group, up: res.status >= 200 && res.status < 300, latencyMs };
  } catch {
    return { name: p.name, label: p.label, group: p.group, up: false, latencyMs: null };
  }
}

function githubHeaders(env: ApiEnv): Record<string, string> {
  const h: Record<string, string> = {
    "User-Agent": UA,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (env.GITHUB_TOKEN) h.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  return h;
}

async function githubJson<T>(path: string, env: ApiEnv): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(`https://api.github.com${path}`, { headers: githubHeaders(env) }, GITHUB_TIMEOUT_MS);
    if (!res.ok) {
      await res.body?.cancel();
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function latestHiveRelease(env: ApiEnv): Promise<StatusPayload["hive"]> {
  const api = await githubJson<{ tag_name?: string; html_url?: string }>("/repos/hivecommons/hive/releases/latest", env);
  if (api?.tag_name) return { latestRelease: api.tag_name, releaseUrl: api.html_url ?? null };

  // Anonymous API quota is shared per egress IP; the releases/latest redirect is not rate-limited.
  try {
    const res = await fetchWithTimeout(
      "https://github.com/hivecommons/hive/releases/latest",
      { headers: { "User-Agent": UA }, redirect: "manual" },
      GITHUB_TIMEOUT_MS,
    );
    await res.body?.cancel();
    const location = res.headers.get("Location");
    const tag = tagFromReleaseUrl(location);
    return { latestRelease: tag, releaseUrl: tag ? new URL(location!, "https://github.com").toString() : null };
  } catch {
    return { latestRelease: null, releaseUrl: null };
  }
}

export async function buildStatus(env: ApiEnv): Promise<StatusPayload> {
  const [endpoints, hive] = await Promise.all([Promise.all(PUBLIC_ENDPOINTS.map(probe)), latestHiveRelease(env)]);
  return { checkedAt: new Date().toISOString(), endpoints, hive };
}

const REPO = "hanthor/dotfiles";
const WINDOW_DAYS = 30;

async function searchCount(q: string, env: ApiEnv): Promise<number | null> {
  const r = await githubJson<{ total_count?: number }>(`/search/issues?per_page=1&q=${encodeURIComponent(q)}`, env);
  return typeof r?.total_count === "number" ? r.total_count : null;
}

export async function buildActivity(env: ApiEnv, now = new Date()): Promise<ActivityPayload> {
  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  const base = `repo:${REPO} is:pr is:merged merged:>=${since}`;
  type Runs = { workflow_runs?: { conclusion: string | null; html_url: string; updated_at: string }[] };
  const [mergedTotal, mergedRenovate, mergedHive, runs] = await Promise.all([
    searchCount(base, env),
    searchCount(`${base} author:app/renovate`, env),
    searchCount(`${base} author:app/hanthor-hive-agent`, env),
    githubJson<Runs>(`/repos/${REPO}/actions/workflows/ci.yml/runs?branch=master&status=completed&per_page=1`, env),
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
  return a.mergedTotal === null && a.mergedRenovate === null && a.mergedHive === null && a.ci.conclusion === null;
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
  hosts: readonly string[] = FACT_HOSTS,
): Promise<FleetPayload> {
  const results = await Promise.all(hosts.map((h) => fetchFacts(h, fetcher)));
  const out: Record<string, FleetFacts | null> = {};
  hosts.forEach((h, i) => (out[h] = results[i]));
  return { hosts: out, fetchedAt: now.toISOString() };
}

export function fleetIsEmpty(f: FleetPayload): boolean {
  return Object.values(f.hosts).every((h) => h === null);
}
