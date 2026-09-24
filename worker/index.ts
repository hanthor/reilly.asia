// Serves the static site, plus /infra/* proxied from the infrastructure
// handbook's GitHub Pages build (hanthor/dotfiles → hanthor.github.io/dotfiles).
// Proxying instead of copying the book in at build time means /infra is always
// as fresh as the handbook itself, with no rebuild of this site.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const INFRA_PREFIX = "/infra";
const INFRA_ORIGIN = "https://hanthor.github.io/dotfiles";

async function proxyInfra(request: Request, url: URL): Promise<Response> {
  if (url.pathname === INFRA_PREFIX) {
    return Response.redirect(`${url.origin}${INFRA_PREFIX}/${url.search}`, 301);
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const upstream = new URL(INFRA_ORIGIN + url.pathname.slice(INFRA_PREFIX.length) + url.search);
  const res = await fetch(upstream.toString(), {
    method: request.method,
    headers: { "User-Agent": "reilly.asia-infra-proxy" },
    cf: { cacheTtl: 300, cacheEverything: true },
    redirect: "manual",
  });

  const headers = new Headers(res.headers);
  // Keep GitHub Pages' redirects (e.g. /foo → /foo/) inside /infra.
  const location = headers.get("Location");
  if (location) {
    const loc = new URL(location, upstream);
    if (loc.origin + loc.pathname.slice(0, "/dotfiles".length) === INFRA_ORIGIN) {
      headers.set("Location", INFRA_PREFIX + loc.pathname.slice("/dotfiles".length) + loc.search);
    }
  }
  headers.set("Cache-Control", "public, max-age=300");
  headers.delete("Set-Cookie");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === INFRA_PREFIX || url.pathname.startsWith(INFRA_PREFIX + "/")) {
      return proxyInfra(request, url);
    }
    return env.ASSETS.fetch(request);
  },
};
