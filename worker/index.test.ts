import { afterEach, beforeEach, describe, expect, it } from "vitest";
import worker from "./index";

const originalFetch = globalThis.fetch;
const originalCaches = (globalThis as typeof globalThis & { caches?: unknown }).caches;

type Cache = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};

function installCache(cache: Cache): void {
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: { default: cache },
  });
}

function installFetch(fetcher: typeof fetch): void {
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: fetcher,
  });
}

function makeContext() {
  const pending: Promise<unknown>[] = [];
  return {
    pending,
    waitUntil(promise: Promise<unknown>) {
      pending.push(promise);
    },
  };
}

function makeEnv() {
  const assetRequests: Request[] = [];
  return {
    assetRequests,
    env: {
      ASSETS: {
        async fetch(request: Request) {
          assetRequests.push(request);
          return new Response("asset body", {
            headers: { "Content-Type": "text/html" },
          });
        },
      },
    },
  };
}

afterEach(() => {
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: originalFetch,
  });
  if (originalCaches === undefined) {
    Reflect.deleteProperty(globalThis, "caches");
  } else {
    Object.defineProperty(globalThis, "caches", {
      configurable: true,
      value: originalCaches,
    });
  }
});

describe("Cloudflare Worker request entrypoint", () => {
  beforeEach(() => {
    installCache({
      async match() {
        return undefined;
      },
      async put() {},
    });
  });

  it("redirects HTTP and www visitors to the canonical host", async () => {
    const { env } = makeEnv();
    const response = await worker.fetch(
      new Request("http://www.reilly.asia/infra/handbook/?page=1", {
        headers: { "cf-visitor": '{"scheme":"http"}' },
      }),
      env,
      makeContext(),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe("https://reilly.asia/infra/handbook/?page=1");
  });

  it("passes non-infra requests to assets", async () => {
    const { env, assetRequests } = makeEnv();
    const response = await worker.fetch(new Request("https://reilly.asia/about"), env, makeContext());

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("asset body");
    expect(assetRequests).toHaveLength(1);
    expect(assetRequests[0].url).toBe("https://reilly.asia/about");
  });

  it("rejects methods other than GET and HEAD under /infra", async () => {
    const { env } = makeEnv();
    const response = await worker.fetch(new Request("https://reilly.asia/infra/", { method: "POST" }), env, makeContext());

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, HEAD");
    expect(await response.text()).toBe("Method Not Allowed");
  });

  it("serves the landing page from the root asset with revalidation headers", async () => {
    const { env, assetRequests } = makeEnv();
    const response = await worker.fetch(new Request("https://reilly.asia/infra/", { method: "HEAD" }), env, makeContext());

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=0, must-revalidate");
    expect(assetRequests).toHaveLength(1);
    expect(assetRequests[0].url).toBe("https://reilly.asia/");
    expect(assetRequests[0].method).toBe("HEAD");
  });

  it("rewrites handbook redirects and removes upstream cookies", async () => {
    const calls: { url: string; method: string }[] = [];
    installFetch(async (input, init) => {
      calls.push({ url: String(input), method: init?.method ?? "GET" });
      return new Response("handbook", {
        status: 302,
        headers: {
          Location: "https://hanthor.github.io/dotfiles/servers/aws/?from=pages",
          "Set-Cookie": "session=upstream-secret",
        },
      });
    });
    const { env } = makeEnv();

    const response = await worker.fetch(new Request("https://reilly.asia/infra/handbook/servers/aws"), env, makeContext());

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/infra/handbook/servers/aws/?from=pages");
    expect(response.headers.get("Set-Cookie")).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
    expect(calls).toEqual([
      {
        url: "https://hanthor.github.io/dotfiles/servers/aws",
        method: "GET",
      },
    ]);
  });

  it("returns a JSON 404 for unknown API routes", async () => {
    const { env } = makeEnv();
    const response = await worker.fetch(new Request("https://reilly.asia/infra/api/missing"), env, makeContext());

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(await response.json()).toEqual({ error: "not found" });
  });

  it("caches empty fleet responses and uses the short empty-result TTL", async () => {
    const stored = new Map<string, Response>();
    const cache: Cache = {
      async match(request) {
        return stored.get(request.url);
      },
      async put(request, response) {
        stored.set(request.url, response);
      },
    };
    installCache(cache);
    const fetched: string[] = [];
    installFetch(async (input) => {
      fetched.push(String(input));
      return new Response("not found", { status: 404 });
    });
    const { env } = makeEnv();
    const firstContext = makeContext();

    const first = await worker.fetch(new Request("https://reilly.asia/infra/api/fleet"), env, firstContext);
    await Promise.all(firstContext.pending);
    const second = await worker.fetch(new Request("https://reilly.asia/infra/api/fleet"), env, makeContext());

    expect(first.headers.get("Cache-Control")).toBe("public, max-age=60");
    expect(await first.json()).toMatchObject({ hosts: {} });
    expect(await second.json()).toMatchObject({ hosts: {} });
    expect(fetched).toHaveLength(8);
    expect(stored).toHaveProperty("size", 1);
  });

  it("serves a live response when the cache is unavailable", async () => {
    installCache({
      async match() {
        throw new Error("cache unavailable");
      },
      async put() {
        throw new Error("cache unavailable");
      },
    });
    installFetch(async () => new Response("not found", { status: 404 }));
    const { env } = makeEnv();

    const response = await worker.fetch(new Request("https://reilly.asia/infra/api/fleet"), env, makeContext());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=60");
  });
});
