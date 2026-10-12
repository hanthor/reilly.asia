/**
 * Shared GitHub API client for development proxy endpoints.
 * Centralizes fetch logic, timeout handling, and error handling.
 */

export interface GitHubFetchOptions {
  timeout?: number;
}

/**
 * Fetch and parse JSON from a GitHub API endpoint.
 * 
 * @param url - Full GitHub API URL to fetch
 * @param options - Configuration options (timeout in ms)
 * @returns Parsed JSON response
 * @throws Error if the fetch fails or response is not ok
 */
export async function fetchGitHubJson<T>(
  url: string,
  options: GitHubFetchOptions = {}
): Promise<T> {
  const { timeout = 10000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
