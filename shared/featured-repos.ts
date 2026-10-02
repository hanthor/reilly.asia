// Repos whose star/fork counts appear on the Projects cards. The counts are
// fetched once at build time (see vite.config.ts), not from visitors'
// browsers, so the page never hits GitHub's 60 req/h unauthenticated limit.
export const featuredRepos = [
  "hivecommons/hive",
  "projectbluefin/utah",
  "ublue-os/bluefin-lts",
  "projectbluefin/bootc-installer",
  "projectbluefin/dakota",
  "tuna-os/tunaos",
  "almalinux/bootc-images",
  "projectbluefin/knuckle",
] as const;

export type RepoStats = Record<string, { stars: number; forks: number }>;
