import type { RepoStats } from "@shared/featured-repos";

declare const __GITHUB_STATS__: RepoStats;

// Baked in at build time by vite.config.ts. Empty if GitHub was unreachable
// during the build — callers should then show no counts rather than zeros.
const stats: RepoStats = typeof __GITHUB_STATS__ === "undefined" ? {} : __GITHUB_STATS__;

export function getRepoStats(repoId: string): { stars: number; forks: number } | undefined {
  return stats[repoId.toLowerCase()];
}
