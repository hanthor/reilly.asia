import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({
  buildStatus: vi.fn(async () => ({ status: "ok" })),
  buildActivity: vi.fn(async () => ({ activity: true })),
  buildFleet: vi.fn(async () => ({ fleet: true })),
  activityIsEmpty: vi.fn(() => false),
  fleetIsEmpty: vi.fn(() => false),
}));
vi.mock("./ghstats-api", () => ({
  buildGhStats: vi.fn(async () => ({ snapshot: { ok: true } })),
}));

import worker from "./index";
import * as api from "./api";
import * as ghstats from "./ghstats-api";

type Env = Parameters<typeof worker.fetch>[1];

const assetsFetch = vi.fn(async (req: Request) => new Response(`asset:${new URL(req.url).pathname}`));
const env = { ASSETS: { fetch: assetsFetch } } as unknown as Env;
const ctx = { waitUntil: vi.fn() };

let cacheStore: Map<string, Response>;

beforeEach(() => {
  cacheStore = new Map();
  vi.stubGlobal("caches", {
    default: {
      match: vi.fn(async (req: Request) => cacheStore.get(req.url)?.clone()),
      put: vi.fn(async (req: Request, res: Response) => void cacheStore.set(req.url, res)),
    },
  });
  vi.mocked(api.activityIsEmpty).mockReturnValue(false);
  vi.mocked(api.fleetIsEmpty).mockReturnValue(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const get = (url: string, init?: RequestInit) => worker.fetch(new Request(url, init), env, ctx);

describe("canonical redirects", () => {
  it("301s www. to the apex host, keeping path and query", async () => {
    const res = await get("https://www.reilly.asia/infra/api/status?x=1");
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("https://reilly.asia/infra/api/status?x=1");
  });

  it("301s plain-http visitors reported by cf-visitor", async () => {
    const res = await get("https://reilly.asia/about", { headers: { "cf-visitor": '{"scheme":"http"}' } });
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("https://reilly.asia/about");
  });

  it("does not redirect https visitors on the apex host", async () => {
    const res = await get("https://reilly.asia/about", { headers: { "cf-visitor": '{"scheme":"https"}' } });
    expect(res.status).toBe(200);
    expect(assetsFetch).toHaveBeenCalledOnce();
  });
});

describe("static assets and method handling", () => {
  it("passes non-infra paths to the assets binding for any method", async () => {
    const res = await get("https://reilly.asia/assets/app.js", { method: "POST" });
    expect(await res.text()).toBe("asset:/assets/app.js");
  });

  it("rejects non-GET/HEAD requests under /infra with 405", async () => {
    const res = await get("https://reilly.asia/infra/api/status", { method: "POST" });
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("GET, HEAD");
    expect(api.buildStatus).not.toHaveBeenCalled();
  });

  it("serves /infra/ from the SPA root with revalidation", async () => {
    const res = await get("https://reilly.asia/infra/");
    expect(assetsFetch.mock.calls[0][0].url).toBe("https://reilly.asia/");
    expect(await res.text()).toBe("asset:/");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=0, must-revalidate");
  });

  it("redirects /infra to /infra/ and legacy links into the handbook", async () => {
    const a = await get("https://reilly.asia/infra");
    expect(a.status).toBe(301);
    expect(a.headers.get("Location")).toBe("https://reilly.asia/infra/");
    const b = await get("https://reilly.asia/infra/servers/aws/");
    expect(b.headers.get("Location")).toBe("https://reilly.asia/infra/handbook/servers/aws/");
  });
});

describe("handbook proxy", () => {
  it("proxies upstream, rewrites Location, strips cookies and sets cache headers", async () => {
    const upstream = vi.fn(async () =>
      new Response("moved", {
        status: 301,
        headers: {
          Location: "https://hanthor.github.io/dotfiles/servers/aws/",
          "Set-Cookie": "a=b",
        },
      }),
    );
    vi.stubGlobal("fetch", upstream);
    const res = await get("https://reilly.asia/infra/handbook/servers/aws");
    expect(upstream).toHaveBeenCalledWith(
      "https://hanthor.github.io/dotfiles/servers/aws",
      expect.objectContaining({ method: "GET", redirect: "manual" }),
    );
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("/infra/handbook/servers/aws/");
    expect(res.headers.get("Set-Cookie")).toBeNull();
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");
  });
});

describe("cached JSON API", () => {
  it("builds, caches and serves /infra/api/status with the status TTL", async () => {
    const res = await get("https://reilly.asia/infra/api/status?cachebust=1");
    expect(await res.json()).toEqual({ status: "ok" });
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(ctx.waitUntil).toHaveBeenCalledOnce();
    // The cache key ignores the query string.
    expect([...cacheStore.keys()]).toEqual(["https://reilly.asia/infra/api/status"]);
  });

  it("returns a cache hit without rebuilding", async () => {
    cacheStore.set("https://reilly.asia/infra/api/status", new Response('{"cached":true}'));
    const res = await get("https://reilly.asia/infra/api/status");
    expect(await res.json()).toEqual({ cached: true });
    expect(api.buildStatus).not.toHaveBeenCalled();
  });

  it("falls back to a live build when the cache throws", async () => {
    vi.stubGlobal("caches", {
      default: {
        match: vi.fn(async () => {
          throw new Error("cache down");
        }),
        put: vi.fn(async () => undefined),
      },
    });
    const res = await get("https://reilly.asia/infra/api/status");
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("answers { error: unavailable } with a short TTL when the build throws", async () => {
    vi.mocked(api.buildStatus).mockRejectedValueOnce(new Error("boom"));
    const res = await get("https://reilly.asia/infra/api/status");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ error: "unavailable" });
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=30");
    expect(ctx.waitUntil).not.toHaveBeenCalled();
  });

  it("uses the short TTL for empty activity and the long one otherwise", async () => {
    vi.mocked(api.activityIsEmpty).mockReturnValueOnce(true);
    const empty = await get("https://reilly.asia/infra/api/activity");
    expect(empty.headers.get("Cache-Control")).toBe("public, max-age=300");
    cacheStore.clear();
    const full = await get("https://reilly.asia/infra/api/activity");
    expect(full.headers.get("Cache-Control")).toBe("public, max-age=3600");
  });

  it("uses the short TTL for an empty fleet and the long one otherwise", async () => {
    vi.mocked(api.fleetIsEmpty).mockReturnValueOnce(true);
    const empty = await get("https://reilly.asia/infra/api/fleet");
    expect(empty.headers.get("Cache-Control")).toBe("public, max-age=60");
    cacheStore.clear();
    const full = await get("https://reilly.asia/infra/api/fleet");
    expect(full.headers.get("Cache-Control")).toBe("public, max-age=600");
  });

  it("404s unknown /infra/api paths with a JSON body", async () => {
    const res = await get("https://reilly.asia/infra/api/nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });
});

describe("/api/ghstats", () => {
  it("builds the user scope by default and the org scope on ?scope=org, with separate cache keys", async () => {
    await get("https://reilly.asia/api/ghstats");
    expect(ghstats.buildGhStats).toHaveBeenLastCalledWith(expect.anything(), "user");
    await get("https://reilly.asia/api/ghstats?scope=org");
    expect(ghstats.buildGhStats).toHaveBeenLastCalledWith(expect.anything(), "org");
    expect(cacheStore.size).toBe(2);
  });

  it("uses the short TTL when no snapshot is available", async () => {
    vi.mocked(ghstats.buildGhStats).mockResolvedValueOnce({ snapshot: null } as never);
    const res = await get("https://reilly.asia/api/ghstats");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");
  });
});

describe("stats.tunaos.org host", () => {
  it("serves /api/ghstats for the org scope", async () => {
    const res = await get("https://stats.tunaos.org/api/ghstats");
    expect(ghstats.buildGhStats).toHaveBeenCalledWith(expect.anything(), "org");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=900");
  });

  it("passes file-like paths to assets and serves the SPA for page paths", async () => {
    const asset = await get("https://stats.tunaos.org/assets/app.js");
    expect(await asset.text()).toBe("asset:/assets/app.js");
    const page = await get("https://stats.tunaos.org/some/page");
    expect(await page.text()).toBe("asset:/");
    expect(page.headers.get("Cache-Control")).toBe("public, max-age=0, must-revalidate");
  });
});
