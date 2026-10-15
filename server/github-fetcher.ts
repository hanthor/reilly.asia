/**
 * Shared GitHub API fetcher with validation and timeouts.
 * Used by both server proxy endpoints and worker API calls.
 */

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_TIMEOUT_MS = 5000;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export function validateGitHubUsername(username: string): boolean {
  return USERNAME_REGEX.test(username) && username.length > 0 && username.length <= 39;
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a GitHub API endpoint, validated and with timeout.
 * Returns parsed JSON on success, null on any error.
 */
export async function githubFetch<T>(
  path: string,
  options?: { timeout?: number }
): Promise<T | null> {
  try {
    const url = `${GITHUB_API_BASE}${path}`;
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
      options?.timeout ?? GITHUB_TIMEOUT_MS
    );

    if (!response.ok) {
      await response.body?.cancel();
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Fetch GitHub user data by validated username.
 * Returns the user object on success, null on any error.
 */
export async function fetchGitHubUser<T>(username: string): Promise<T | null> {
  if (!validateGitHubUsername(username)) {
    return null;
  }
  return githubFetch<T>(`/users/${username}`);
}

/**
 * Fetch GitHub repositories for a validated username.
 * Returns array of repository objects on success, null on any error.
 */
export async function fetchGitHubRepos<T>(username: string): Promise<T[] | null> {
  if (!validateGitHubUsername(username)) {
    return null;
  }
  return githubFetch<T[]>(
    `/users/${username}/repos?sort=updated&per_page=50`
  );
}
