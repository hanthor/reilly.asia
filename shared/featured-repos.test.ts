import { describe, expect, it } from "vitest";
import { featuredRepos, type RepoStats } from "./featured-repos";

describe("featured-repos", () => {
  describe("featuredRepos", () => {
    it("exports an array of featured repository names", () => {
      expect(Array.isArray(featuredRepos)).toBe(true);
      expect(featuredRepos.length).toBeGreaterThan(0);
    });

    it("contains expected hivecommons/hive repository", () => {
      expect(featuredRepos).toContain("hivecommons/hive");
    });

    it("contains expected projectbluefin repositories", () => {
      const projectBluefinRepos = featuredRepos.filter((repo) => repo.startsWith("projectbluefin/"));
      expect(projectBluefinRepos.length).toBeGreaterThanOrEqual(3);
      expect(projectBluefinRepos).toContain("projectbluefin/utah");
      expect(projectBluefinRepos).toContain("projectbluefin/bootc-installer");
      expect(projectBluefinRepos).toContain("projectbluefin/dakota");
    });

    it("contains ublue-os/bluefin-lts", () => {
      expect(featuredRepos).toContain("ublue-os/bluefin-lts");
    });

    it("contains community project repositories", () => {
      expect(featuredRepos).toContain("tuna-os/tunaos");
      expect(featuredRepos).toContain("almalinux/bootc-images");
    });

    it("all featured repos follow owner/repo format", () => {
      for (const repo of featuredRepos) {
        expect(repo).toMatch(/^[^/]+\/[^/]+$/);
        const parts = repo.split("/");
        expect(parts).toHaveLength(2);
        expect(parts[0].length).toBeGreaterThan(0);
        expect(parts[1].length).toBeGreaterThan(0);
      }
    });

    it("has no duplicate repositories", () => {
      const unique = new Set(featuredRepos);
      expect(unique.size).toBe(featuredRepos.length);
    });
  });

  describe("RepoStats type", () => {
    it("accepts a valid RepoStats record", () => {
      const stats: RepoStats = {
        "hivecommons/hive": { stars: 100, forks: 10 },
        "projectbluefin/utah": { stars: 50, forks: 5 },
      };
      expect(stats).toBeDefined();
      expect(Object.keys(stats)).toHaveLength(2);
      expect(stats["hivecommons/hive"].stars).toBe(100);
    });

    it("accepts empty RepoStats", () => {
      const stats: RepoStats = {};
      expect(stats).toBeDefined();
      expect(Object.keys(stats)).toHaveLength(0);
    });

    it("enforces stars and forks as numbers", () => {
      // This test verifies the TypeScript type through inference
      const stats: RepoStats = {
        "test/repo": { stars: 123, forks: 45 },
      };
      const starsCount = stats["test/repo"].stars;
      expect(typeof starsCount).toBe("number");
      const forksCount = stats["test/repo"].forks;
      expect(typeof forksCount).toBe("number");
    });
  });
});
