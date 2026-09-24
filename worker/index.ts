// Serves the static site. The Worker runs first only for /infra/* (see
// wrangler.jsonc):
//   /infra/             → the SPA's infrastructure landing page
//   /infra/handbook/*   → proxied from the handbook's GitHub Pages build
//                         (hanthor/dotfiles → hanthor.github.io/dotfiles), so it
//                         is always as fresh as the book with no site rebuild
//   /infra/api/status   → live public-endpoint health, cached 60s
//   /infra/api/activity → repo automation counts from GitHub, cached 1h
//   /infra/<other>      → 301 to /infra/handbook/<other> (pre-landing links)

import { buildActivity, buildStatus, activityIsEmpty, type ApiEnv } from "./api";
import { classifyInfraPath, rewriteHandbookLocation } from "./routes";

interface Env extends ApiEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
}

const STATUS_TTL = 60;
const ACTIVITY_TTL = 3600;
const ACTIVITY_EMPTY_TTL = 300;

function methodNotAllowed(): Response {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
}

async function proxyHandbook(request: Request, upstream: string): Promise<Response> {
  const res = await fetch(upstream, {
    method: request.method,
    headers: { "User-Agent": "reilly.asia-infra-proxy" },
    cf: { cacheTtl: 300, cacheEverything: true },
    redirect: "manual",
  });
  const headers = new Headers(res.headers);
  const location = headers.get("Location");
  if (location) {
    const rewritten = rewriteHandbookLocation(location, upstream);
    if (rewritten) headers.set("Location", rewritten);
  }
  headers.set("Cache-Control", "public, max-age=300");
  headers.delete("Set-Cookie");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function json(body: unknown, maxAge: number): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/** Serve from caches.default, or build + store. Never throws. */
async function cachedJson(
  request: Request,
  ctx: Ctx,
  build: () => Promise<{ body: unknown; ttl: number }>,
): Promise<Response> {
  const key = new Request(new URL(new URL(request.url).pathname, request.url).toString(), { method: "GET" });
  const cache = caches.default;
  try {
    const hit = await cache.match(key);
    if (hit) return hit;
  } catch {
    // Cache unavailable — fall through to a live build.
  }
  let res: Response;
  try {
    const { body, ttl } = await build();
    res = json(body, ttl);
    try {
      ctx.waitUntil(cache.put(key, res.clone()).catch(() => undefined));
    } catch {
      // ignore
    }
  } catch {
    res = json({ error: "unavailable" }, 30);
  }
  return res;
}

async function landing(request: Request, env: Env): Promise<Response> {
  // Fetch "/" not "/index.html": asset html_handling would redirect the latter.
  const res = await env.ASSETS.fetch(new Request(new URL("/", request.url), { method: request.method }));
  const headers = new Headers(res.headers);
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);
    const route = classifyInfraPath(url.pathname, url.search);
    if (route.kind === "pass") return env.ASSETS.fetch(request);
    if (request.method !== "GET" && request.method !== "HEAD") return methodNotAllowed();

    switch (route.kind) {
      case "redirect":
        return Response.redirect(url.origin + route.location, 301);
      case "landing":
        return landing(request, env);
      case "handbook":
        return proxyHandbook(request, route.upstream);
      case "api-status":
        return cachedJson(request, ctx, async () => ({ body: await buildStatus(env), ttl: STATUS_TTL }));
      case "api-activity":
        return cachedJson(request, ctx, async () => {
          const body = await buildActivity(env);
          return { body, ttl: activityIsEmpty(body) ? ACTIVITY_EMPTY_TTL : ACTIVITY_TTL };
        });
      case "api-not-found":
        return new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
    }
  },
};
