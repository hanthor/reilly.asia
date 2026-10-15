import { describe, it, expect } from "vitest";
import { validateGitHubUsername } from "./github-fetcher";

describe("validateGitHubUsername", () => {
  it("accepts valid usernames", () => {
    expect(validateGitHubUsername("hanthor")).toBe(true);
    expect(validateGitHubUsername("user-name")).toBe(true);
    expect(validateGitHubUsername("user_name")).toBe(true);
    expect(validateGitHubUsername("user123")).toBe(true);
    expect(validateGitHubUsername("a")).toBe(true);
  });

  it("rejects invalid usernames", () => {
    expect(validateGitHubUsername("")).toBe(false);
    expect(validateGitHubUsername("user@name")).toBe(false);
    expect(validateGitHubUsername("user name")).toBe(false);
    expect(validateGitHubUsername("user.name")).toBe(false);
    expect(validateGitHubUsername("user/name")).toBe(false);
  });

  it("rejects usernames exceeding GitHub's 39 character limit", () => {
    expect(validateGitHubUsername("a".repeat(40))).toBe(false);
    expect(validateGitHubUsername("a".repeat(39))).toBe(true);
  });
});
