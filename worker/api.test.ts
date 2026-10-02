import { describe, expect, it } from "vitest";
import { buildFleet, fleetIsEmpty } from "./api";
import { FACT_HOSTS, FACTS_RAW_BASE } from "../shared/fleet";

const PUNJAB = {
  schema: 1,
  host: "punjab",
  updated: "2026-09-24T14:50:55Z",
  os: { name: "Ubuntu", version: "24.04" },
  hardware: { vendor: "Amazon EC2", model: "t3.large", cpu_threads: "2", memory_gb: 7.6, mac: "de:ad:be:ef:00:01" },
  address: "10.0.0.5",
};

function fakeFetch(files: Record<string, string | (() => Promise<Response>)>) {
  const seen: string[] = [];
  const fetcher = async (url: string) => {
    seen.push(url);
    const host = url.slice(FACTS_RAW_BASE.length).replace(/\.json$/, "");
    const f = files[host];
    if (typeof f === "function") return f();
    if (f === undefined) return new Response("404: Not Found", { status: 404 });
    return new Response(f, { status: 200 });
  };
  return { fetcher, seen };
}

describe("buildFleet", () => {
  const now = new Date("2026-09-24T15:00:00Z");

  it("returns every known host, with facts for reporters and null for the rest", async () => {
    const { fetcher, seen } = fakeFetch({ punjab: JSON.stringify(PUNJAB) });
    const body = await buildFleet(fetcher, now);
    expect(Object.keys(body.hosts).sort()).toEqual([...FACT_HOSTS].sort());
    expect(seen).toHaveLength(FACT_HOSTS.length);
    expect(seen).toContain(`${FACTS_RAW_BASE}punjab.json`);
    expect(body.fetchedAt).toBe("2026-09-24T15:00:00.000Z");
    const p = body.hosts.punjab!;
    expect(p.os.name).toBe("Ubuntu");
    expect(p.hardware.cpu_threads).toBe(2);
    expect(JSON.stringify(body)).not.toMatch(/10\.0\.0\.5|de:ad|address|"mac"/);
    for (const h of FACT_HOSTS) if (h !== "punjab") expect(body.hosts[h]).toBeNull();
    expect(fleetIsEmpty(body)).toBe(false);
  });

  it("degrades to null on network errors, bad JSON, non-objects and oversized files", async () => {
    const { fetcher } = fakeFetch({
      punjab: () => Promise.reject(new Error("boom")),
      goa: "{not json",
      dilli: "[1,2,3]",
      kanpur: JSON.stringify({ pad: "x".repeat(70_000) }),
      himachal: () => Promise.resolve(new Response("oops", { status: 500 })),
    });
    const body = await buildFleet(fetcher, now);
    expect(Object.values(body.hosts).every((h) => h === null)).toBe(true);
    expect(fleetIsEmpty(body)).toBe(true);
  });

  it("only fetches the requested host list", async () => {
    const { fetcher, seen } = fakeFetch({});
    const body = await buildFleet(fetcher, now, ["goa"]);
    expect(seen).toEqual([`${FACTS_RAW_BASE}goa.json`]);
    expect(body.hosts).toEqual({ goa: null });
  });
});
