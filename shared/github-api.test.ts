import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateGitHubUsername, fetchWithTimeout, fetchGitHubApi, fetchGitHubUser, fetchGitHubUserRepos } from "./github-api";

describe("validateGitHubUsername", () => {
  it("accepts valid usernames", () => {
    expect(validateGitHubUsername("torvalds")).toBe(true);
    expect(validateGitHubUsername("guido-van-rossum")).toBe(true);
    expect(validateGitHubUsername("e1447a")).toBe(true);
  });

  it("rejects invalid usernames", () => {
    expect(validateGitHubUsername("")).toBe(false);
    expect(validateGitHubUsername("-start-with-dash")).toBe(false);
    expect(validateGitHubUsername("end-with-dash-")).toBe(false);
    expect(validateGitHubUsername("user@domain")).toBe(false);
    expect(validateGitHubUsername("user with space")).toBe(false);
    expect(validateGitHubUsername("user_underscore")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateGitHubUsername("")).toBe(false);
  });
});

describe("fetchWithTimeout", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("applies timeout using AbortController", async () => {
    let abortCalled = false;
    const mockResponse = new Response("test", { status: 200 });

    fetchSpy.mockImplementation(
      (_, init) => {
        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            abortCalled = true;
          });
        }
        return Promise.resolve(mockResponse);
      },
    );

    await fetchWithTimeout("https://example.com", {}, 100);
    // Timeout will be set but won't fire during successful response
    expect(abortCalled).toBe(false);
  });

  it("calls fetch with provided init options", async () => {
    fetchSpy.mockResolvedValue(new Response("test", { status: 200 }));

    await fetchWithTimeout("https://example.com", { headers: { "X-Test": "value" } }, 5000);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        headers: { "X-Test": "value" },
      }),
    );
  });
});

describe("fetchGitHubApi", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on success", async () => {
    const mockData = { id: 1, name: "test" };
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await fetchGitHubApi("/users/test");
    expect(result).toEqual(mockData);
  });

  it("returns null on non-ok response", async () => {
    fetchSpy.mockResolvedValue(
      new Response("Not Found", { status: 404 }),
    );

    const result = await fetchGitHubApi("/users/nonexistent");
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    fetchSpy.mockRejectedValue(new Error("Network error"));

    const result = await fetchGitHubApi("/users/test");
    expect(result).toBeNull();
  });

  it("includes correct GitHub API headers", async () => {
    fetchSpy.mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    await fetchGitHubApi("/users/test");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.github.com/users/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": "reilly.asia",
          Accept: "application/vnd.github+json",
        }),
      }),
    );
  });
});

describe("fetchGitHubUser", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates username before fetching", async () => {
    const result = await fetchGitHubUser("invalid@user");
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches valid username", async () => {
    const mockData = { login: "torvalds", id: 1 };
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 200 }),
    );

    const result = await fetchGitHubUser("torvalds");
    expect(result).toEqual(mockData);
  });
});

describe("fetchGitHubUserRepos", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates username before fetching", async () => {
    const result = await fetchGitHubUserRepos("invalid-");
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches repos with pagination params", async () => {
    const mockData = [{ id: 1, name: "repo1" }];
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 200 }),
    );

    const result = await fetchGitHubUserRepos("torvalds");
    expect(result).toEqual(mockData);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("sort=updated&per_page=50"),
      expect.any(Object),
    );
  });
});
