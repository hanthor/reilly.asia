import { describe, expect, it } from "vitest";
import { classifyInfraPath, rewriteHandbookLocation } from "./routes";

describe("classifyInfraPath", () => {
  it("passes non-infra paths through", () => {
    expect(classifyInfraPath("/")).toEqual({ kind: "pass" });
    expect(classifyInfraPath("/infrastructure")).toEqual({ kind: "pass" });
  });
  it("adds the trailing slash to /infra and /infra/handbook", () => {
    expect(classifyInfraPath("/infra", "?a=1")).toEqual({ kind: "redirect", location: "/infra/?a=1" });
    expect(classifyInfraPath("/infra/handbook")).toEqual({ kind: "redirect", location: "/infra/handbook/" });
  });
  it("serves the landing page at /infra/", () => {
    expect(classifyInfraPath("/infra/")).toEqual({ kind: "landing" });
  });
  it("routes the API", () => {
    expect(classifyInfraPath("/infra/api/status")).toEqual({ kind: "api-status" });
    expect(classifyInfraPath("/infra/api/activity")).toEqual({ kind: "api-activity" });
    expect(classifyInfraPath("/infra/api/nope")).toEqual({ kind: "api-not-found" });
    expect(classifyInfraPath("/infra/api")).toEqual({ kind: "api-not-found" });
  });
  it("proxies the handbook", () => {
    expect(classifyInfraPath("/infra/handbook/servers/aws/", "?q=1")).toEqual({
      kind: "handbook",
      upstream: "https://hanthor.github.io/dotfiles/servers/aws/?q=1",
    });
    expect(classifyInfraPath("/infra/handbook/")).toEqual({ kind: "handbook", upstream: "https://hanthor.github.io/dotfiles/" });
  });
  it("redirects legacy handbook links", () => {
    expect(classifyInfraPath("/infra/servers/aws/")).toEqual({ kind: "redirect", location: "/infra/handbook/servers/aws/" });
    expect(classifyInfraPath("/infra/automation.html", "?x")).toEqual({ kind: "redirect", location: "/infra/handbook/automation.html?x" });
  });
});

describe("rewriteHandbookLocation", () => {
  const up = "https://hanthor.github.io/dotfiles/servers/aws";
  it("keeps GitHub Pages redirects inside the handbook", () => {
    expect(rewriteHandbookLocation("https://hanthor.github.io/dotfiles/servers/aws/", up)).toBe("/infra/handbook/servers/aws/");
    expect(rewriteHandbookLocation("/dotfiles/servers/aws/?a=b", up)).toBe("/infra/handbook/servers/aws/?a=b");
    expect(rewriteHandbookLocation("https://hanthor.github.io/dotfiles", up)).toBe("/infra/handbook/");
  });
  it("leaves foreign redirects alone", () => {
    expect(rewriteHandbookLocation("https://example.com/dotfiles/x", up)).toBeNull();
    expect(rewriteHandbookLocation("https://hanthor.github.io/dotfilesX/x", up)).toBeNull();
  });
});
