// Pure routing for everything under /infra. Kept separate from index.ts so it
// can be unit-tested without a Workers runtime.

export const INFRA_PREFIX = "/infra";
export const HANDBOOK_PREFIX = "/infra/handbook";
export const HANDBOOK_ORIGIN = "https://hanthor.github.io/dotfiles";

export type InfraRoute =
  | { kind: "landing" }
  | { kind: "redirect"; location: string }
  | { kind: "handbook"; upstream: string }
  | { kind: "api-status" }
  | { kind: "api-activity" }
  | { kind: "api-not-found" }
  | { kind: "pass" };

export function classifyInfraPath(pathname: string, search = ""): InfraRoute {
  if (pathname === INFRA_PREFIX) return { kind: "redirect", location: `${INFRA_PREFIX}/${search}` };
  if (pathname === INFRA_PREFIX + "/") return { kind: "landing" };
  if (!pathname.startsWith(INFRA_PREFIX + "/")) return { kind: "pass" };

  if (pathname === "/infra/api/status") return { kind: "api-status" };
  if (pathname === "/infra/api/activity") return { kind: "api-activity" };
  if (pathname === "/infra/api" || pathname.startsWith("/infra/api/")) return { kind: "api-not-found" };

  if (pathname === HANDBOOK_PREFIX) return { kind: "redirect", location: `${HANDBOOK_PREFIX}/${search}` };
  if (pathname.startsWith(HANDBOOK_PREFIX + "/")) {
    return { kind: "handbook", upstream: HANDBOOK_ORIGIN + pathname.slice(HANDBOOK_PREFIX.length) + search };
  }

  // Pre-landing-page links pointed straight into the book at /infra/<page>.
  return { kind: "redirect", location: HANDBOOK_PREFIX + pathname.slice(INFRA_PREFIX.length) + search };
}

/** Rewrite a GitHub Pages redirect (e.g. /dotfiles/foo → /dotfiles/foo/) to stay under the handbook prefix. */
export function rewriteHandbookLocation(location: string, upstream: string): string | null {
  const loc = new URL(location, upstream);
  const origin = new URL(HANDBOOK_ORIGIN);
  if (loc.origin !== origin.origin) return null;
  if (loc.pathname !== origin.pathname && !loc.pathname.startsWith(origin.pathname + "/")) return null;
  const rest = loc.pathname.slice(origin.pathname.length) || "/";
  return HANDBOOK_PREFIX + rest + loc.search;
}
