// /api/ghstats - GitHub stats snapshot and live data

import type { GhSnapshot, GhLive, GhEvent, GhScope } from "../shared/ghstats";
import { GH_LOGIN, GH_ORG, ORG_SNAPSHOT_URL, SNAPSHOT_URL, normalizeEvents } from "../shared/ghstats";

export interface GhStatsEnv {
  GITHUB_TOKEN?: string;
}

const SNAPSHOT_TIMEOUT_MS = 15_000;
const EVENTS_TIMEOUT_MS = 5000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ms);
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (e) {
    return null;
  }
}

function apiHeaders(env: GhStatsEnv): Record<string, string> {
  const headers: Record<string, string> = { "User-Agent": "reilly.asia-ghstats" };
  if (env.GITHUB_TOKEN) headers.Authorization = `token ${env.GITHUB_TOKEN}`;
  return headers;
}

/** Fetch the snapshot JSON from GitHub releases. */
export async function getSnapshot(env: GhStatsEnv, scope: GhScope = "user"): Promise<GhSnapshot | null> {
  const res = await fetchWithTimeout(scope === "org" ? ORG_SNAPSHOT_URL : SNAPSHOT_URL, {}, SNAPSHOT_TIMEOUT_MS);
  if (!res?.ok) return null;
  try {
    return (await res.json()) as GhSnapshot;
  } catch {
    return null;
  }
}

/** Fetch recent public events for the live activity feed. */
export async function getLiveEvents(
  env: GhStatsEnv,
  since: Date,
  scope: GhScope = "user",
): Promise<GhEvent[] | null> {
  const url = scope === "org"
    ? `https://api.github.com/orgs/${GH_ORG}/events?per_page=60`
    : `https://api.github.com/users/${GH_LOGIN}/events/public?per_page=30`;
  const headers = apiHeaders(env);
  const res = await fetchWithTimeout(url, { headers }, EVENTS_TIMEOUT_MS);
  if (!res?.ok) return null;
  try {
    const events = (await res.json()) as unknown[];
    return normalizeEvents(events);
  } catch {
    return null;
  }
}

/** Serve ghstats snapshot and live data. */
export async function buildGhStats(env: GhStatsEnv, scope: GhScope = "user"): Promise<{
  snapshot: GhSnapshot | null;
  live: GhLive | null;
}> {
  const [snapshot, events] = await Promise.all([
    getSnapshot(env, scope),
    getLiveEvents(env, new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), scope),
  ]);

  const live: GhLive | null = snapshot
    ? {
        fetchedAt: new Date().toISOString(),
        since: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        merged: null,
        truncated: false,
        events: events,
      }
    : null;

  return { snapshot, live };
}
