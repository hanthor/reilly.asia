import { describe, expect, it } from "vitest";
import { summarize, tagFromReleaseUrl } from "./infra";

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

describe("tagFromReleaseUrl", () => {
  it("parses the releases/latest redirect", () => {
    expect(tagFromReleaseUrl("https://github.com/hivecommons/hive/releases/tag/v5.35.5")).toBe("v5.35.5");
    expect(tagFromReleaseUrl("/hivecommons/hive/releases/tag/v5.1.0?x=1")).toBe("v5.1.0");
    expect(tagFromReleaseUrl("https://github.com/hivecommons/hive/releases")).toBeNull();
    expect(tagFromReleaseUrl(null)).toBeNull();
  });
});
