import { describe, expect, it } from "vitest";
import { ciState, formatAgo, formatCount, formatLatency, latencyTier, summarize, tagFromReleaseUrl } from "./infra";

describe("summarize", () => {
  it("is operational when everything is up", () => {
    expect(summarize([{ up: true }, { up: true }])).toEqual({ up: 2, down: 0, unknown: 0, total: 2, state: "operational" });
  });
  it("is degraded with a mix", () => {
    expect(summarize([{ up: true }, { up: false }]).state).toBe("degraded");
    expect(summarize([{ up: true }, { up: null }]).state).toBe("degraded");
  });
  it("is down only when every measured endpoint failed", () => {
    expect(summarize([{ up: false }, { up: false }]).state).toBe("down");
    expect(summarize([{ up: false }, { up: null }]).state).toBe("degraded");
  });
  it("is unknown with nothing measured", () => {
    expect(summarize([]).state).toBe("unknown");
    expect(summarize([{ up: null }]).state).toBe("unknown");
  });
});

describe("formatAgo", () => {
  const now = 1_000_000_000;
  it.each([
    [0, "just now"],
    [4_999, "just now"],
    [12_000, "12s ago"],
    [180_000, "3m ago"],
    [2 * 3_600_000, "2h ago"],
    [4 * 86_400_000, "4d ago"],
  ])("%i ms → %s", (delta, out) => expect(formatAgo(now - delta, now)).toBe(out));
  it("clamps future timestamps and rejects NaN", () => {
    expect(formatAgo(now + 60_000, now)).toBe("just now");
    expect(formatAgo(Number.NaN, now)).toBe("—");
  });
});

describe("formatLatency / latencyTier", () => {
  it("formats", () => {
    expect(formatLatency(null)).toBe("—");
    expect(formatLatency(84.4)).toBe("84 ms");
    expect(formatLatency(1234)).toBe("1.2 s");
    expect(formatLatency(-1)).toBe("—");
  });
  it("tiers", () => {
    expect(latencyTier(null)).toBe("none");
    expect(latencyTier(120)).toBe("fast");
    expect(latencyTier(900)).toBe("ok");
    expect(latencyTier(2400)).toBe("slow");
  });
});

describe("formatCount", () => {
  it("renders null as an em dash", () => {
    expect(formatCount(null)).toBe("—");
    expect(formatCount(undefined)).toBe("—");
    expect(formatCount(0)).toBe("0");
    expect(formatCount(1234)).toBe("1,234");
  });
});

describe("tagFromReleaseUrl", () => {
  it("parses the releases/latest redirect", () => {
    expect(tagFromReleaseUrl("https://github.com/hivecommons/hive/releases/tag/v5.35.5")).toBe("v5.35.5");
    expect(tagFromReleaseUrl("/hivecommons/hive/releases/tag/v5.1.0?x=1")).toBe("v5.1.0");
    expect(tagFromReleaseUrl("https://github.com/hivecommons/hive/releases")).toBeNull();
    expect(tagFromReleaseUrl(null)).toBeNull();
  });
});

describe("ciState", () => {
  it("maps conclusions", () => {
    expect(ciState("success")).toBe("passing");
    expect(ciState("failure")).toBe("failing");
    expect(ciState("cancelled")).toBe("unknown");
    expect(ciState(null)).toBe("unknown");
  });
});
