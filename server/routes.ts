import type { Express } from "express";
import { createServer, type Server } from "http";

const GITHUB_API_TIMEOUT_MS = 10000; // 10 seconds

async function fetchWithTimeout(url: string, timeoutMs: number = GITHUB_API_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // GitHub API proxy endpoint to avoid CORS issues during development
  app.get("/api/github/user/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const response = await fetchWithTimeout(`https://api.github.com/users/${username}`);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch GitHub user data" 
      });
    }
  });

  app.get("/api/github/user/:username/repos", async (req, res) => {
    try {
      const { username } = req.params;
      const response = await fetchWithTimeout(`https://api.github.com/users/${username}/repos?sort=updated&per_page=50`);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch GitHub repositories" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
