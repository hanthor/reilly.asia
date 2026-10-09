/**
 * Shared HTTP fetcher utilities for client, server, and worker layers.
 * Provides timeout protection, GitHub API support, and consistent error handling.
 */

export interface FetcherOptions {
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Additional headers to include */
  headers?: Record<string, string>;
  /** User-Agent header (default: "reilly.asia") */
  userAgent?: string;
}

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_USER_AGENT = "reilly.asia";

/**
 * Create a generic JSON fetcher with timeout protection.
 * Aborts the request if it takes longer than the specified timeout.
 */
export function createJsonFetcher(options?: FetcherOptions) {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const userAgent = options?.userAgent ?? DEFAULT_USER_AGENT;
  const extraHeaders = options?.headers ?? {};

  return async function fetchJson<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = {
        "User-Agent": userAgent,
        Accept: "application/json",
        ...extraHeaders,
      };

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("Content-Type") ?? "";
      if (!contentType.includes("json")) {
        throw new Error("Response is not JSON");
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Create a GitHub API fetcher with authentication and error handling.
 * Failures return null to allow graceful degradation.
 */
export function createGithubFetcher(token?: string, options?: FetcherOptions) {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const userAgent = options?.userAgent ?? DEFAULT_USER_AGENT;
  const extraHeaders = options?.headers ?? {};

  return async function fetchGithub<T>(path: string): Promise<T | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = {
        "User-Agent": userAgent,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...extraHeaders,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`https://api.github.com${path}`, {
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        // Cancel response body to free resources
        await response.body?.cancel();
        return null;
      }

      return (await response.json()) as T;
    } catch {
      // Timeouts, network errors, and other failures degrade to null
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Create a fetcher for probing HTTP endpoints (status checks).
 * Returns response status and latency; failures are indicated by up: false.
 */
export interface ProbeResult {
  status: number | null;
  latencyMs: number | null;
  ok: boolean;
}

export function createProbeFetcher(options?: FetcherOptions) {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const userAgent = options?.userAgent ?? DEFAULT_USER_AGENT;
  const extraHeaders = options?.headers ?? {};

  return async function probe(url: string): Promise<ProbeResult> {
    const started = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = {
        "User-Agent": userAgent,
        ...extraHeaders,
      };

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: "manual",
        cache: "no-store",
      });

      const latencyMs = Date.now() - started;
      const ok = response.status >= 200 && response.status < 300;

      // Cancel response body to free resources
      await response.body?.cancel();

      return { status: response.status, latencyMs, ok };
    } catch {
      const latencyMs = Date.now() - started;
      return { status: null, latencyMs, ok: false };
    } finally {
      clearTimeout(timeoutId);
    }
  };
}
