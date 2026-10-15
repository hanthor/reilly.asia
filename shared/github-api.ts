/**
 * Shared GitHub API utilities for server and worker endpoints.
 * All calls are bounded by timeout and handle errors gracefully.
 */

/** Username must be alphanumeric or hyphen only */
export function validateGitHubUsername(username: string): boolean {
  if (!username) return false;
  // GitHub usernames are 1-39 characters, alphanumeric or hyphen, don't start/end with hyphen
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username);
}

/** Apply timeout to fetch requests using AbortController */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs: number = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch and parse GitHub API endpoint as JSON.
 * Returns null if validation fails, timeout occurs, or response is not ok.
 */
export async function fetchGitHubApi<T>(
  path: string,
  timeoutMs: number = 5000,
): Promise<T | null> {
  try {
    const response = await fetchWithTimeout(
      `https://api.github.com${path}`,
      {
        headers: {
          "User-Agent": "reilly.asia",
          Accept: "application/vnd.github+json",
        },
      },
      timeoutMs,
    );

    if (!response.ok) {
      await response.body?.cancel();
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    // Timeout, network error, or parse error
    return null;
  }
}

/**
 * Fetch GitHub user data by username.
 * Validates username and applies timeout. Returns null on failure.
 */
export async function fetchGitHubUser(username: string): Promise<Record<string, unknown> | null> {
  if (!validateGitHubUsername(username)) {
    return null;
  }

  return fetchGitHubApi(`/users/${encodeURIComponent(username)}`);
}

/**
 * Fetch GitHub user repositories by username.
 * Validates username and applies timeout. Returns null on failure.
 */
export async function fetchGitHubUserRepos(username: string): Promise<Array<Record<string, unknown>> | null> {
  if (!validateGitHubUsername(username)) {
    return null;
  }

  return fetchGitHubApi(
    `/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=50`,
  );
}
