import type { Express } from "express";
import { createServer, type Server } from "http";
import { createJsonFetcher } from "../shared/fetcher";

export async function registerRoutes(app: Express): Promise<Server> {
  const fetchJson = createJsonFetcher({ timeout: 5000 });

  // GitHub API proxy endpoint to avoid CORS issues during development
  // Uses the shared fetcher for consistent timeout and error handling
  app.get("/api/github/user/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const data = await fetchJson<unknown>(
        `https://api.github.com/users/${username}`
      );
      res.json(data);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch GitHub user data",
      });
    }
  });

  app.get("/api/github/user/:username/repos", async (req, res) => {
    try {
      const { username } = req.params;
      const data = await fetchJson<unknown>(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=50`
      );
      res.json(data);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch GitHub repositories",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
