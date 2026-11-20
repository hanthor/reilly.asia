import { describe, expect, it } from "vitest";
import { createdPrQuery, isBotLogin, mergeFromSearchItem, mergedPrQuery, parseRange, parseScope, periodAverages, rangeDays, trailingUtcDays } from "./ghstats";

describe("scope", () => {
  it("defaults to the user", () => {
    expect(parseScope(null)).toBe("user");
    expect(parseScope("anything")).toBe("user");
    expect(parseScope("org")).toBe("org");
  });

  it("builds the search for each scope", () => {
    expect(mergedPrQuery("user")).toBe("author:hanthor is:pr is:merged is:public");
    expect(mergedPrQuery("org")).toBe("org:tuna-os is:pr is:merged is:public");
    expect(createdPrQuery("org")).toBe("org:tuna-os is:pr is:public");
  });
});

describe("isBotLogin", () => {
  it("flags GitHub Apps and automation users", () => {
    expect(isBotLogin("hanthor-hive-agent[bot]")).toBe(true);
    expect(isBotLogin("renovate[bot]")).toBe(true);
    expect(isBotLogin("dependabot")).toBe(true);
    expect(isBotLogin("hanthor")).toBe(false);
    expect(isBotLogin("renovated-human")).toBe(false);
  });
});

describe("mergeFromSearchItem", () => {
  it("keeps the PR author when the search item has one", () => {
    const m = mergeFromSearchItem({
      number: 7,
      title: "fix",
      html_url: "https://github.com/tuna-os/docs/pull/7",
      created_at: "2026-11-18T00:00:00Z",
      repository_url: "https://api.github.com/repos/tuna-os/docs",
      pull_request: { merged_at: "2026-11-18T01:00:00Z" },
      user: { login: "tuna-reef-hive[bot]" },
    });
    expect(m).toMatchObject({ repo: "tuna-os/docs", number: 7, author: "tuna-reef-hive[bot]" });
  });
});

describe("range", () => {
  it("defaults to the year", () => {
    expect(parseRange(null)).toBe("year");
    expect(parseRange("decade")).toBe("year");
    expect(parseRange("week")).toBe("week");
    expect(rangeDays("month")).toBe(30);
  });

  it("lists the trailing UTC days ending today", () => {
    const days = trailingUtcDays(7, new Date("2026-03-02T23:30:00Z"));
    expect(days).toEqual(["2026-02-24", "2026-02-25", "2026-02-26", "2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
  });

  it("averages per day, week and month", () => {
    expect(periodAverages(70, 7)).toEqual({ day: 10, week: 70, month: 304.375 });
    expect(periodAverages(5, 0).day).toBe(0);
  });
});
