import type { Express } from "express";
import { createServer, type Server } from "http";

const GITHUB_API_TIMEOUT = 5000; // 5 seconds

/**
 * Fetch with timeout support using AbortController.
 * Rejects if the request takes longer than the specified timeout.
 */
async function fetchWithTimeout(
  url: string,
  timeout: number = GITHUB_API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // GitHub API proxy endpoint to avoid CORS issues during development
  app.get("/api/github/user/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const response = await fetchWithTimeout(
        `https://api.github.com/users/${username}`
      );
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        res.status(504).json({
          success: false,
          message: "GitHub API request timeout",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to fetch GitHub user data",
        });
      }
    }
  });

  app.get("/api/github/user/:username/repos", async (req, res) => {
    try {
      const { username } = req.params;
      const response = await fetchWithTimeout(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=50`
      );
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        res.status(504).json({
          success: false,
          message: "GitHub API request timeout",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to fetch GitHub repositories",
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
