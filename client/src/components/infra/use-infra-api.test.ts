import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The hooks only wrap useQuery, so capture the options they pass to it
// instead of rendering. That keeps these tests in the node environment.
const useQuery = vi.hoisted(() => vi.fn((options: unknown) => options));
vi.mock("@tanstack/react-query", () => ({ useQuery }));
// vitest.config.ts has no @shared alias, so resolve the module by relative path.
vi.mock("@shared/infra-routes", async () => await import("../../../../shared/infra-routes"));

import { INFRA_API_PATHS } from "../../../../shared/infra-routes";
import { useFleetFacts, useInfraActivity, useInfraStatus } from "./use-infra-api";

interface Options {
  queryKey: string[];
  queryFn: () => Promise<unknown>;
  refetchInterval?: number;
  refetchIntervalInBackground?: boolean;
  staleTime: number;
}

const options = (hook: () => unknown) => hook() as Options;

function respond(body: unknown, init: { ok?: boolean; status?: number; type?: string | null } = {}) {
  const { ok = true, status = 200, type = "application/json; charset=utf-8" } = init;
  const fetchMock = vi.fn(async () => ({
    ok,
    status,
    headers: { get: (name: string) => (name === "Content-Type" ? type : null) },
    json: async () => body,
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => useQuery.mockClear());
afterEach(() => vi.unstubAllGlobals());

describe("query options", () => {
  it("polls status every minute, but not while the tab is in the background", () => {
    const o = options(useInfraStatus);
    expect(o.queryKey).toEqual([INFRA_API_PATHS.status]);
    expect(o.refetchInterval).toBe(60_000);
    expect(o.refetchIntervalInBackground).toBe(false);
    expect(o.staleTime).toBe(30_000);
  });

  it("never refetches activity", () => {
    const o = options(useInfraActivity);
    expect(o.queryKey).toEqual([INFRA_API_PATHS.activity]);
    expect(o.staleTime).toBe(Infinity);
    expect(o.refetchInterval).toBeUndefined();
  });

  it("keeps fleet facts fresh for five minutes", () => {
    const o = options(useFleetFacts);
    expect(o.queryKey).toEqual([INFRA_API_PATHS.fleet]);
    expect(o.staleTime).toBe(5 * 60_000);
  });
});

describe("queryFn (getJson)", () => {
  it.each([
    ["useInfraStatus", useInfraStatus, INFRA_API_PATHS.status],
    ["useInfraActivity", useInfraActivity, INFRA_API_PATHS.activity],
    ["useFleetFacts", useFleetFacts, INFRA_API_PATHS.fleet],
  ])("%s requests its own path asking for JSON and returns the parsed body", async (_n, hook, path) => {
    const payload = { hello: "world" };
    const fetchMock = respond(payload);
    await expect(options(hook).queryFn()).resolves.toBe(payload);
    expect(fetchMock).toHaveBeenCalledWith(path, { headers: { Accept: "application/json" } });
  });

  it("rejects with the HTTP status when the response is not ok", async () => {
    respond({}, { ok: false, status: 503 });
    await expect(options(useInfraStatus).queryFn()).rejects.toThrow("503");
  });

  it("rejects non-JSON responses such as the Vite dev server's index.html", async () => {
    respond("<html>", { type: "text/html" });
    await expect(options(useInfraStatus).queryFn()).rejects.toThrow("not json");
  });

  it("treats a missing Content-Type header as non-JSON", async () => {
    respond({}, { type: null });
    await expect(options(useInfraStatus).queryFn()).rejects.toThrow("not json");
  });

  it("propagates network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(options(useFleetFacts).queryFn()).rejects.toThrow("offline");
  });
});
