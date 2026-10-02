import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins plain string class names with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values (undefined, null, false, empty string)", () => {
    expect(cn("a", undefined, null, false, "", "b")).toBe("a b");
  });

  it("expands an object of conditional classes, keeping only truthy keys", () => {
    expect(cn({ a: true, b: false, c: true })).toBe("a c");
  });

  it("flattens arrays of class names", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("returns an empty string when given nothing usable", () => {
    expect(cn()).toBe("");
    expect(cn(undefined, null, false)).toBe("");
  });

  it("merges Tailwind utilities so the later conflicting class wins", () => {
    // tailwind-merge's core job: same-property utilities collide, last wins.
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("keeps non-conflicting Tailwind utilities from multiple sources", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
  });

  it("lets a later conditional override an earlier plain class", () => {
    expect(cn("text-sm", { "text-lg": true })).toBe("text-lg");
  });

  it("preserves non-Tailwind arbitrary class names untouched", () => {
    expect(cn("my-custom-class", "another-one")).toBe("my-custom-class another-one");
  });
});
