import type { Express } from "express";
import { createServer, type Server } from "http";
import { fetchGitHubUser, fetchGitHubUserRepos, validateGitHubUsername } from "../shared/github-api";

export async function registerRoutes(app: Express): Promise<Server> {
  // GitHub API proxy endpoint to avoid CORS issues during development
  // Validates username, applies timeout, and degrades gracefully on error.
  app.get("/api/github/user/:username", async (req, res) => {
    const { username } = req.params;

    // Validate username format
    if (!validateGitHubUsername(username)) {
      return res.status(400).json({
        success: false,
        message: "Invalid GitHub username format",
      });
    }

    const data = await fetchGitHubUser(username);
    if (!data) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch GitHub user data",
      });
    }

    res.json(data);
  });

  // GitHub repositories endpoint
  // Validates username, applies timeout, and degrades gracefully on error.
  app.get("/api/github/user/:username/repos", async (req, res) => {
    const { username } = req.params;

    // Validate username format
    if (!validateGitHubUsername(username)) {
      return res.status(400).json({
        success: false,
        message: "Invalid GitHub username format",
      });
    }

    const data = await fetchGitHubUserRepos(username);
    if (!data) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch GitHub repositories",
      });
    }

    res.json(data);
  });

  const httpServer = createServer(app);
  return httpServer;
}
